# CreatureStudio

CreatureStudio is a **local-first creature creation studio** for building
procedural animals (starting with an Elephant) using a shared blueprint
schema, a FastAPI backend, and a Three.js/WebGL viewer on the frontend.

The current milestone (v0.1.9) includes:

- A validated **SpeciesBlueprint** schema and on-disk JSON blueprints.
- A **FastAPI** backend that can list, load, save, template, and import
  blueprints.
- A **Vite + ES modules** frontend with:
  - Left sidebar **Species / Blueprint Browser**.
  - Center **3D viewport** that renders a creature from a blueprint.
  - Right sidebar **Inspector** with read-only panels for Body Plan,
    Skeleton, Body Parts, Materials, and Behavior.
- Built-in **blueprint templates** (quadruped, biped, winged, no‑ped) and
  an `ElephantBlueprint.json` derived from the animal rulebook.
- Basic testing and QA:
  - Backend tests for blueprint templates, "New from Template", and import.
  - A frontend/runtime smoke test that constructs the Elephant in Three.js.

The long-term goal is to use these tools to rapidly build new creatures
(cats, birds, snakes, etc.) by authoring and iterating on blueprints.

---

## Project Layout

At the top level you will find:

```text
CreatureStudio/
  .gitignore
  README.md
  backend/
  frontend/
  shared/
    blueprints/
    templates/
  scripts/
  docs/
    animalrulebook/
  exports/
```

- `backend/` – FastAPI app, Pydantic models, and services for managing
  species blueprints and exports.
- `frontend/` – Vite-powered ES module frontend, Three.js viewer, and
  editor UI.
- `shared/` – Blueprint JSON and template JSON shared between backend and
  frontend:
  - `shared/blueprints/ElephantBlueprint.json` is the canonical Elephant
    blueprint used by both sides.
  - `shared/templates/Template*.json` contains template blueprints used by
    "New from Template".
- `scripts/` – Utility scripts such as blueprint validation and release
  packaging.
- `docs/animalrulebook/` – Human-readable rulebook explaining how the
  Elephant (and future animals) are constructed.
- `exports/` – A workspace for exported archives created by the app itself.
  This directory is **ignored by git** and is not included in release
  zips created by the packaging script.

---

## Backend – FastAPI

The backend is a small FastAPI application that:

- Serves health and introspection endpoints.
- Manages the list of available blueprints on disk.
- Loads and saves individual blueprints.
- Creates new species from built-in templates.
- Imports blueprints from uploaded JSON files.
- Exposes an export endpoint for packaging a species and its assets.

### Requirements

- Python 3.11+
- `pip`

### Installation & Running

From the project root:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

By default the backend listens on `http://127.0.0.1:8000`.

Useful endpoints (for manual inspection):

- `GET /health` – simple health probe.
- `GET /api/blueprints` – list available blueprints.
- `GET /api/blueprints/{name}` – load a specific blueprint.
- `POST /api/blueprints` – create a new blueprint from a template.
  - Body: `{ "name": "MyNewSpecies", "templateType": "quadruped" }`.
- `POST /api/blueprints/import` – upload a JSON blueprint file and import
  it as a new species.

---

## Frontend – Vite + Three.js

The frontend is a Vite-based ES module app that talks to the FastAPI
backend and renders the current species blueprint in a Three.js viewport.

### Requirements

- Node.js 18+ (Node 20+ recommended)
- `npm`

### Installation & Running

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite will print a local dev URL (typically
`http://127.0.0.1:5173/`). Open it in your browser with the backend
already running.

### UI Structure

- **Left sidebar – Species / Blueprint Browser**
  - Lists all available species (blueprints) discovered via the backend.
  - Lets you select a species to view.
  - Provides actions to:
    - **New from Template** – create a new species from a built-in template
      (quadruped, biped, winged, no‑ped).
    - **Import** – import a blueprint JSON file from disk.
- **Center – 3D Viewport**
  - Uses Three.js + the runtime helper to construct a creature from the
    currently loaded blueprint.
  - Provides orbit, pan, and zoom controls.
- **Right sidebar – Inspector**
  - Contains tabbed panels:
    - **Body Plan** – high-level proportions, core bones, and body segments.
    - **Skeleton** – skeletal structure view.
    - **Body Parts** – individual part definitions and their attachments.
    - **Materials** – material definitions used by the renderer.
    - **Behavior** – high-level behavior hooks (stubbed for now).

The inspector panels are currently **read-only** views over the active
blueprint. Later phases extend this into full editing.

---

## Using the Studio

With both backend and frontend running:

1. Open the frontend in your browser.
2. In the left sidebar, choose **Elephant**.
   - The viewport will render an Elephant built from
     `shared/blueprints/ElephantBlueprint.json`.
3. Explore the **Inspector** panels on the right to see how the body plan,
   skeleton, materials, and parts relate to each other.
4. Click **New from Template** in the left sidebar to create a new species:
   - Provide a unique name (e.g. `MyQuadrupedTest`).
   - Enter a template type such as `quadruped`.
   - The backend will clone the template blueprint, save it under
     `shared/blueprints/MyQuadrupedTestBlueprint.json`, and return it.
   - The frontend will select and display the new species.
5. Use **Import** to bring in a modified blueprint JSON file
   (for example, a tweaked copy of the Elephant blueprint):
   - The backend will validate the JSON against the `SpeciesBlueprint`
     model and enforce protected names.
   - If valid, it will be written to `shared/blueprints/` and appear in
     the species list.

For a more narrative and domain-focused explanation of how the Elephant and
other animals are constructed, refer to the documents under
`docs/animalrulebook/`.

---

## Testing and QA

The goal of the current test suite is to catch regressions in the backend
blueprint flows and to provide a basic smoke test for the runtime.

### Backend tests (pytest)

From `CreatureStudio/backend` with your virtualenv activated:

```bash
pytest
```

This runs:

- Core backend tests.
- `tests/test_templates_and_import_api.py`, which covers:
  - Template file existence and template helpers.
  - `POST /api/blueprints` ("New from Template") happy path and error paths.
  - `POST /api/blueprints/import` happy path and error paths.

### Runtime smoke test (Node)

From `CreatureStudio/frontend`:

```bash
npm run test:runtime
```

This executes `tests/runtime_smoke_test.mjs`, which:

- Loads `src/blueprints/ElephantBlueprint.json`.
- Calls `createCreatureFromBlueprint`.
- Asserts that a valid Three.js creature graph (group, skinned mesh,
  skeleton, bones array) is produced without errors.

For a more complete manual QA flow (including viewport interaction and
UI-level checks), see `docs/QA_Checklist.md`.

---

## Release Packaging

Phase 9 adds a small helper script for producing a release zip.

### What the script does

- Walks the project root.
- Excludes:
  - `.git`, `.idea`, `.vscode`.
  - `node_modules`, `env`, `venv`, `.venv`.
  - `__pycache__`, `exports/`.
  - Temporary files such as `.pyc`, `.pyo`, `.pyd`, `.log`.
  - Any nested `*.zip` files.
- Writes a new archive one directory above the project root named:

  ```text
  creatureStudioV{version}.zip
  ```

- Stores all content under a single top-level `CreatureStudio/` directory
  inside the zip.

### Creating a release zip (example: v0.1.9)

From the project root (`CreatureStudio/`):

```bash
python scripts/make_release_zip.py --version 0.1.9
```

This will create:

```text
../creatureStudioV0.1.9.zip
```

You can of course use any version string you like. For example, to
reproduce the procedure described in the Phase 9 plan file, you could run:

```bash
python scripts/make_release_zip.py --version 0.1.0
```

The contents and structure of the archive are identical; only the filename
changes.

---

## Next Steps

With documentation and release packaging in place, the next logical steps
for CreatureStudio are:

- Turning the inspector panels into full, bidirectional editors.
- Adding animation controls and behavior previews in the viewport.
- Extending the rulebook and templates to cover new body plans (cats,
  birds, snakes, etc.).
- Iterating on the export pipeline so that generated animals can be
  consumed directly by other tools and games.
