# CreatureStudio Usage Guide

This guide walks through the day-to-day usage of CreatureStudio as of
version **v0.1.9**. It assumes you have already set up and started both
the backend and frontend as described in `README.md`.

The core idea: **a SpeciesBlueprint JSON file fully describes a creature**.
The backend reads and writes these blueprints, and the frontend renders
them in a 3D viewport and exposes them via inspector panels.

---

## 1. Starting the Studio

1. **Start the backend** (FastAPI):

   ```bash
   cd CreatureStudio/backend
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

   By default this listens on `http://127.0.0.1:8000`.

2. **Start the frontend** (Vite + Three.js):

   ```bash
   cd CreatureStudio/frontend
   npm install
   npm run dev
   ```

   Vite will show a local dev URL such as `http://127.0.0.1:5173/`. Open
   that URL in your browser.

Once both are running, the frontend will automatically talk to the backend
API at `http://127.0.0.1:8000` (configurable in the frontend if needed).

---

## 2. Species / Blueprint Browser (Left Sidebar)

The **left sidebar** is the main entry point for selecting and managing
species.

- It lists all available species as reported by the backend:
  - Each entry corresponds to a `*Blueprint.json` file under
    `shared/blueprints/`.
- Clicking an entry:
  - Requests the blueprint from the backend.
  - Updates the global studio state.
  - Triggers a re-render of both the viewport and the inspector panels.

### 2.1. New from Template

The **New from Template** action lets you quickly spin up a new species
using one of the built-in templates:

- `quadruped`
- `biped`
- `winged`
- `no-ped` (snake / snail-like)

Flow:

1. Click **New from Template**.
2. Enter a **unique species name**, e.g. `MyQuadrupedTest`.
3. Enter a **template type** (one of the above labels).
4. The frontend calls `POST /api/blueprints` with:

   ```json
   { "name": "MyQuadrupedTest", "templateType": "quadruped" }
   ```

5. The backend:
   - Validates the name (non-empty, not protected).
   - Loads the corresponding template JSON from `shared/templates/`.
   - Clones it, sets `meta.name` to your chosen name.
   - Saves it as `shared/blueprints/MyQuadrupedTestBlueprint.json`.
   - Returns the new blueprint to the frontend.

6. The frontend:
   - Adds the new species to the list.
   - Selects it.
   - Updates the viewport and inspector.

**Protected names.** Some species names (such as `Elephant`) are protected
and cannot be used for new species created from templates or imported via
JSON. In these cases you will see a conflict/error dialog instead.

### 2.2. Import Blueprint

The **Import** action lets you bring in existing blueprint JSON files.

Typical workflow:

1. Copy `shared/blueprints/ElephantBlueprint.json` to a new file and edit
   it (for example, change `meta.name` and tweak proportions).
2. In the CreatureStudio UI, click **Import**.
3. Select your modified blueprint JSON.
4. The backend:
   - Validates that the uploaded file is valid JSON.
   - Validates that it matches the `SpeciesBlueprint` Pydantic model.
   - Checks that `meta.name` is present, non-empty, and not protected.
   - Saves the file under `shared/blueprints/{meta.name}Blueprint.json`.
5. The frontend reloads the index and shows the new species in the list.

If validation fails (invalid JSON, missing `meta.name`, protected name),
the backend returns a clear 400/409 response and the frontend surfaces an
error dialog.

---

## 3. 3D Viewport (Center)

The **3D viewport** renders the currently selected species using Three.js.

Internally it:

- Loads the blueprint JSON for the current species.
- Passes it to a runtime helper (e.g. `createCreatureFromBlueprint`).
- That helper constructs:
  - A `THREE.Group` root node.
  - A `THREE.SkinnedMesh` with geometry and material.
  - A `THREE.Skeleton` with the correct bones.
- The mesh is added to the scene along with ground, lighting, and camera.

Interaction:

- **Orbit** – Left-click and drag.
- **Pan** – Middle-click (or right-click, depending on config) and drag.
- **Zoom** – Mouse wheel or trackpad pinch / scroll.

If the creature ever disappears from view during navigation, use the
"reset camera" control (if present) or simply reload the page and re-select
the species. The QA checklist (`docs/QA_Checklist.md`) includes a quick
smoke test to verify viewport sanity.

---

## 4. Inspector Panels (Right Sidebar)

The **right sidebar** contains tabbed panels that expose different aspects
of the current blueprint. In v0.1.9 these panels are **read-only** and
intended for inspection and debugging rather than direct editing.

### 4.1. Body Plan Panel

- Shows the high-level body segments and proportions.
- Provides a conceptual view of how the creature is broken down into
  torso, neck, head, legs, tail, etc.
- Useful for sanity-checking that a blueprint's structure matches the
  mental model described in the animal rulebook.

### 4.2. Skeleton Panel

- Displays the logical skeleton as defined by the blueprint.
- Helps connect named bones (`spine_base`, `neck_base`, `tail_tip`, etc.)
  to how geometry is generated and skinned.
- Often used when debugging attachment points (like tusks, ears, tails).

### 4.3. Body Parts Panel

- Lists individual body parts and their attachment relationships.
- Useful for verifying that each procedural generator has the inputs it
  needs and that parts are parented to the expected bones.

### 4.4. Materials Panel

- Shows material definitions and any high-level shading / color settings
  driven by the blueprint.
- Useful for verifying that material slots align with what the renderer
  expects.

### 4.5. Behavior Panel

- Placeholder for high-level behavior hooks (locomotion, idle states,
  interactions).
- Currently primarily a debug view that holds place for future behavior
  authoring, driven by both the blueprint and the animal rulebook.

Future phases can make these panels editable, turning CreatureStudio into
a full editor. For now, they provide an at-a-glance view of the blueprint
structure as rendered in the app.

---

## 5. Blueprint Files on Disk

All blueprints live in:

```text
shared/blueprints/
```

Examples:

- `ElephantBlueprint.json` – canonical elephant.
- `MyQuadrupedTestBlueprint.json` – a quadruped created from a template.
- `QA_ImportedElephantBlueprint.json` – an imported tweak of the Elephant.

**Key rules:**

- The filename is always `{meta.name}Blueprint.json`.
- The JSON must validate against the `SpeciesBlueprint` Pydantic model.
- `meta.name` must be present, non-empty, and unique.
- Some names (like `Elephant`) are protected and may not be overwritten
  or re-used via import.

To validate all blueprints from the command line, you can run:

```bash
cd CreatureStudio
python scripts/validate_blueprints.py
```

The script will report which blueprints are valid or invalid, and will
return a non-zero exit code if any fail validation.

---

## 6. Animal Rulebook

The **animal rulebook** lives under:

```text
docs/animalrulebook/
```

It explains, in human terms:

- The mental model behind the Elephant and other potential species.
- How bones, segments, and procedural generators relate.
- How to think about body plans (quadruped, biped, winged, no‑ped) in a
  way that maps cleanly onto the blueprint schema.

Whenever you find yourself wondering "how should this new creature be
structured?", start with the rulebook, then translate those ideas into a
new blueprint or template.

---

## 7. Exported Artifacts

The `exports/` directory (ignored by git and excluded from release zips)
is a workspace for artifacts created by the app (for example, exporting
a packaged Elephant for downstream tools). You can safely delete its
contents at any time.

Any future export features should write into this directory by default.

---

## 8. Where to Go Next

From a usage perspective, the next big steps are:

- **Blueprint authoring:** introduce editing controls in the inspector
  panels so you can manipulate proportions and body parts directly.
- **Animation previews:** let you play simple walk cycles or idle loops
  inside the viewport.
- **New templates:** expand the template set (cat-like quadrupeds, birds,
  snakes) using patterns from the animal rulebook.

CreatureStudio is designed so that all of this can be driven by the same
blueprint schema and shared rulebook, keeping the mental model consistent
as the tool grows.
