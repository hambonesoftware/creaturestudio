# CreatureStudio Architecture

This document describes the overall architecture of CreatureStudio as of
version **v0.1.9**. The goals are:

- to explain how the backend, frontend, and shared assets fit together,
- to show where the SpeciesBlueprint model lives and how it flows through
  the system,
- to outline how the Elephant and other species are represented, and
  where to extend the system when adding new creatures.

---

## 1. High-Level Overview

At a high level, CreatureStudio is composed of three layers:

1. **Backend (FastAPI / Python)** – manages blueprints on disk, validates
   them, provides template and import flows, and exposes a JSON API.
2. **Frontend (Vite / ES modules / Three.js)** – fetches blueprints from
   the backend, renders them in a 3D viewport, and surfaces them via
   inspector panels.
3. **Shared assets (JSON / docs)** – blueprint JSON files, template JSON
   files, and the human-facing animal rulebook that defines the mental
   model of how creatures should be built.

Data flows from disk → backend → frontend → Three.js:

```text
shared/blueprints/*.json
     ↓ (Pydantic SpeciesBlueprint)
backend/app/services/blueprint_store.py
     ↓ (FastAPI)
/api/blueprints, /api/blueprints/{name}, /api/blueprints/import
     ↓ (fetch in frontend)
frontend/src/runtime/createCreatureFromBlueprint.js
     ↓ (Three.js)
3D viewport rendering of the creature
```

---

## 2. Backend

The backend lives under:

```text
backend/
  app/
    main.py
    config.py
    models/
      blueprint.py
    services/
      blueprint_store.py
      export_service.py
    routers/
      blueprints.py
      export.py
  tests/
```

### 2.1. Configuration (`app/config.py`)

The `Settings` model in `config.py` defines key paths:

- `shared_dir` – root of shared assets (`shared/` at the project level).
- `blueprints_dir` – where blueprint JSON files live.
- `templates_dir` – where template JSON files live.
- `exports_dir` – where exported archives are written.
- `docs_dir` – where docs (including the animal rulebook) live.

These settings are used by services such as `blueprint_store` and
`export_service` to resolve paths without hard-coding absolute locations.

### 2.2. SpeciesBlueprint model (`app/models/blueprint.py`)

The **SpeciesBlueprint** Pydantic model is the canonical in-memory
representation of a species. It roughly covers:

- `meta` – name, version, description, and other metadata.
- `bodyPlan` – high-level segmentation and proportions.
- `skeleton` – bone hierarchy and transforms.
- `parts` – body parts and their attachment points.
- `materials` – material slots used by the renderer.
- `behavior` – high-level hooks for future behavior/animation systems.

Any blueprint JSON file must parse successfully into this model; this is
what gives the backend and frontend a shared contract.

### 2.3. Blueprint Store (`app/services/blueprint_store.py`)

The blueprint store is responsible for all on-disk blueprint operations:

- Listing available blueprints (`list_blueprints`).
- Loading a blueprint (`load_blueprint`).
- Saving a blueprint (`save_blueprint`).
- Deleting a blueprint (`delete_blueprint`).
- Template support:
  - `TEMPLATE_FILE_MAP` – maps logical template labels (quadruped, biped,
    winged, no-ped) to template JSON filenames in `shared/templates/`.
  - `load_template_blueprint(label, settings)` – loads and validates a
    template JSON into a `SpeciesBlueprint`.
  - `create_blueprint_from_template(name, template_type, settings)` –
    clones a template, sets `meta.name`, and saves it as a new blueprint.
- Import support:
  - `import_blueprint_from_bytes(payload, settings)` – parses uploaded JSON
    bytes, validates the resulting `SpeciesBlueprint`, enforces protected
    names, and saves it to `shared/blueprints/`.

The store also defines exceptions such as:

- `BlueprintNotFoundError`
- `BlueprintValidationError`
- `ProtectedBlueprintError`

These are translated into HTTP-level errors by the API routers.

### 2.4. Routers (`app/routers/*.py`)

- `blueprints.py` exposes endpoints for:
  - `GET /api/blueprints` – list blueprints.
  - `GET /api/blueprints/{name}` – load a single blueprint.
  - `POST /api/blueprints` – create a new blueprint from a template (body
    includes `name` and `templateType`).
  - `POST /api/blueprints/import` – import a blueprint from uploaded JSON.
- `export.py` exposes export-related endpoints (e.g., packaging a species
  into an archive under `exports/`).

All endpoints rely on `SpeciesBlueprint` as the response model for
blueprint operations, ensuring the same structure that the frontend
expects.

### 2.5. Tests (`backend/tests/`)

Backend tests exercise:

- Basic API behaviour (listing, loading blueprints).
- Template helpers and template-based creation.
- Import helpers and API-level import flows.

In Phase 9, the focus is on the tests in
`tests/test_templates_and_import_api.py`, which ensure that the template
and import endpoints behave correctly and that all referenced template
files exist on disk.

---

## 3. Frontend

The frontend lives under:

```text
frontend/
  index.html
  vite.config.js
  package.json
  src/
    main.js
    layout.js
    studioState.js
    api/
      blueprintsApi.js
    runtime/
      createCreatureFromBlueprint.js
    viewport/
    ui/
      leftSidebarSpeciesBrowser.js
      rightSidebarInspector.js
      panels/
    tests/
      runtime_smoke_test.mjs
```

### 3.1. State & API Layer

- `studioState.js` – holds global state (current blueprint name, loaded
  blueprint data, blueprint index, etc.) and exposes a simple subscription
  mechanism for UI components.
- `api/blueprintsApi.js` – wraps the backend API endpoints, providing
  functions such as:
  - `listBlueprints()`
  - `loadBlueprint(name)`
  - `createBlueprintFromTemplate({ name, templateType })`
  - `importBlueprintFromFile(file)`

All UI components and controllers go through these helpers rather than
calling `fetch` directly.

### 3.2. Layout & UI Components

- `layout.js` – wires together the three major panels:
  - Left sidebar (`createLeftSidebarSpeciesBrowser`).
  - Center viewport.
  - Right sidebar (`createRightSidebarInspector`).
- `ui/leftSidebarSpeciesBrowser.js` – renders the species list and the
  "New from Template" and "Import" actions.
- `ui/rightSidebarInspector.js` – builds the inspector shell and tabs and
  plugs in the various panels.
- `ui/panels/*.js` – panel implementations for Body Plan, Skeleton, Body
  Parts, Materials, and Behavior.

Whenever `studioState` changes, subscribed components re-render themselves.

### 3.3. Runtime & Viewport

- `runtime/createCreatureFromBlueprint.js` – converts a `SpeciesBlueprint`
  JSON object into a Three.js scene graph. It is responsible for:
  - creating bones and skeletons,
  - building skinned geometry,
  - wiring up the skeleton and mesh so animation can be applied later.
- `viewport/` – creates the Three.js renderer, scene, camera, lights, and
  ground plane, and provides camera controls and resize handling.

The runtime has a Node-only smoke test:

- `frontend/tests/runtime_smoke_test.mjs` – loads the Elephant blueprint,
  calls `createCreatureFromBlueprint`, and asserts that the resulting
  structure is valid (group, skinned mesh, skeleton, bones).

---

## 4. Shared Assets

The shared assets live under:

```text
shared/
  blueprints/
  templates/
```

- `shared/blueprints/` – contains individual species blueprints such as
  `ElephantBlueprint.json`. These are owned by both backend and frontend.
- `shared/templates/` – contains template blueprints such as
  `TemplateQuadruped.json`, which are used by the `New from Template`
  flow and mapped via `TEMPLATE_FILE_MAP` in the backend.

The semantic rules for blueprint filenames are:

- `{meta.name}Blueprint.json` for concrete species.
- `Template*.json` for reusable templates.

---

## 5. Scripts

The `scripts/` directory contains helper scripts that operate on the whole
project:

- `validate_blueprints.py` – validates all blueprints in
  `shared/blueprints/` against the `SpeciesBlueprint` model. Useful
  for CI and for checking that hand-edited JSON is still valid.
- `make_release_zip.py` – creates a release archive from a clean checkout.
  - Excludes development-only directories and artifacts.
  - Produces `CreatureStudioV{version}.zip` one directory above the
    project root.
  - Ensures that the archive contains a single `CreatureStudio/` root
    directory, making it easy to unpack on another machine.

---

## 6. Docs & Animal Rulebook

The documentation tree looks like:

```text
docs/
  UsageGuide.md
  Architecture.md
  QA_Checklist.md
  animalrulebook/
    00_OverviewAndMentalModel.md
    01_FileLayoutAndResponsibilities.md
    ...
```

- `UsageGuide.md` – day-to-day usage instructions.
- `Architecture.md` – this document.
- `QA_Checklist.md` – test and QA steps for verifying the studio.
- `animalrulebook/` – domain-specific design rules and mental models for
  building animals from blueprints.

The rulebook is deliberately human-friendly prose and diagrams, while the
blueprint schema and runtime are machine-focused. Together they provide a
bridge between "how an animal should behave/look" and "how to encode that
in JSON and code".

---

## 7. Adding New Creatures

When adding a new creature (e.g., a cat):

1. **Decide on a body plan** (quadruped, biped, winged, no‑ped) using the
   animal rulebook.
2. **Start from a template**:
   - Use `New from Template` in the UI, or
   - Clone a template JSON from `shared/templates/`.
3. **Edit the blueprint**:
   - Adjust `meta`, `bodyPlan`, `skeleton`, `parts`, and `materials`.
   - Use the validator script to ensure it still matches the schema:
     `python scripts/validate_blueprints.py`.
4. **Reload in the frontend**:
   - Select your new species in the left sidebar.
   - Inspect the result in the viewport and inspector panels.
5. **Iterate** until the creature matches the intended design.

Future phases will provide richer in-app editing, but the underlying
architecture is already structured around this blueprint-driven workflow.

---

## 8. Release Process (Summary)

From an architectural standpoint, a release consists of:

1. Ensuring tests and smoke tests pass:
   - `pytest` in `backend/`.
   - `npm run test:runtime` in `frontend/`.
2. Optionally running manual QA using `docs/QA_Checklist.md`.
3. Creating a release archive:

   ```bash
   cd CreatureStudio
   python scripts/make_release_zip.py --version 0.1.9
   ```

4. Distributing the resulting `CreatureStudioV0.1.9.zip` to target
   machines, where it can be unpacked and run locally.

This keeps the architecture and release story tightly aligned: a single
self-contained folder, driven by JSON blueprints, FastAPI, and Three.js.
