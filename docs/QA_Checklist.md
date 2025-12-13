# CreatureStudio QA Checklist (Phase 8: Testing & QA)

This document describes how to sanity‑check the CreatureStudio stack after
Phase 8, and how to run the automated tests that now exist for the backend
and the runtime / frontend.

The goal is not exhaustive coverage, but a **repeatable checklist** that
catches most regressions around:
- blueprint templates
- creating new species from templates
- importing blueprints
- editing + previewing the Elephant
- basic viewport interaction

---

## 1. Environment Setup

### 1.1 Backend (FastAPI)

1. Open a terminal and change into the backend directory:

   ```bash
   cd CreatureStudio/backend
   ```

2. Create and activate a virtual environment (optional but recommended):

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # on Windows: .venv\Scripts\activate
   ```

3. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI app:

   ```bash
   uvicorn app.main:app --reload
   ```

   By default this will listen on `http://127.0.0.1:8000`.

### 1.2 Frontend (Vite + Three.js)

1. In a separate terminal, change into the frontend directory:

   ```bash
   cd CreatureStudio/frontend
   ```

2. Install dependencies (only needed once per environment):

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open the URL shown by Vite in your browser (typically
   `http://127.0.0.1:5173/`).

---

## 2. Automated Tests

### 2.0 One-shot runner

From the repo root you can run all automated QA checks (backend pytest,
runtime smoke test, and elephant parity contract test) with:

```bash
./scripts/run_phase8_checks.sh
```

### 2.1 Backend tests (pytest)

From `CreatureStudio/backend` with your virtualenv active:

```bash
cd CreatureStudio/backend
pytest
```

This will run:

- existing API / service tests (blueprint listing, loading, export), and
- Phase‑8 tests in `backend/tests/test_templates_and_import_api.py` that
  cover:
  - template file existence + template loading helpers
  - the `POST /api/blueprints` "New from Template" endpoint (success,
    unknown templateType, protected names)
  - the `POST /api/blueprints/import` endpoint (success, no file, invalid
    JSON, missing `meta.name`, protected‐name imports)

All tests should pass with exit code `0`.

### 2.2 Runtime / frontend smoke test

From `CreatureStudio/frontend` after `npm install`:

```bash
cd CreatureStudio/frontend
npm run test:runtime
```

This runs `tests/runtime_smoke_test.mjs`, which:

- loads `src/blueprints/ElephantBlueprint.json`
- calls `createCreatureFromBlueprint(blueprint)`
- asserts that a valid `THREE.Group`, `THREE.SkinnedMesh`, `THREE.Skeleton`,
  and non‑empty bones array are returned

On success, you should see a message like:

> Runtime smoke test passed: Elephant creature can be constructed from its blueprint.

If Three.js is not installed or Node is too old, the script will fail fast
with a clear error message.

---

## 3. Manual QA Flows

These steps assume both backend and frontend are running as described above.

### 3.1 Elephant – load, edit, preview, save

1. Open the main CreatureStudio UI in your browser.
2. In the **left sidebar**, locate and select the **Elephant** species.
   - The currently selected blueprint is highlighted.
3. Wait for the blueprint to load; the right‑hand inspector should update
   to show the Elephant body plan / skeleton / parts.
4. In the **Body Plan** or **Skeleton** panel on the right, make a small,
   visible change (for example, tweak a torso length or leg scale slider).
5. Confirm that the **viewport** updates the 3D creature when parameters
   change (you should see the Elephant subtly change shape).
6. Use the **Save** / **Update Blueprint** action (depending on current UI
   wording) to persist the changes.
7. Refresh the page:
   - Re‑select **Elephant**.
   - Verify that your change is still present (the modified dimension or
     parameter remains at the new value).

### 3.2 New Species from Template

1. With the app running, open the left sidebar **species browser**.
2. Click the **“New from Template”** action (button or menu entry).
3. When prompted:
   - Enter a new species name, for example: `QA_QuadrupedTemplateTest`.
   - Enter a template type such as `quadruped`.
4. Confirm that:
   - No error dialog is shown.
   - The species list refreshes and **QA_QuadrupedTemplateTest** appears.
   - The new species is selected and a creature appears in the viewport.
5. Verify on disk (optional, but recommended):
   - Check that `shared/blueprints/QA_QuadrupedTemplateTestBlueprint.json`
     was created.
6. Negative checks:
   - Repeat the “New from Template” action using the name `Elephant` and
     template `quadruped`.
   - Confirm the UI reports a conflict error (HTTP 409 in the logs) and no
     new blueprint file is created.

### 3.3 Import Blueprint (happy path)

1. Locate a copy of `ElephantBlueprint.json` on disk
   (`CreatureStudio/shared/blueprints/ElephantBlueprint.json`).
2. Make a copy named something like `ElephantBlueprint_QAImport.json` and
   edit it so that `meta.name` is unique, e.g. `QA_ImportedElephant`.
3. In the running UI, use the **Import** action in the left sidebar to
   select this tweaked JSON file.
4. Confirm that:
   - No error dialog is shown.
   - A new species named `QA_ImportedElephant` appears in the species list.
   - Selecting it shows a valid creature in the viewport.
   - On disk, `shared/blueprints/QA_ImportedElephantBlueprint.json` exists.

### 3.4 Import Blueprint – error cases

Perform the following quick, manual negative tests (they mirror the new
automated tests):

1. **Protected name**:
   - Import the unmodified `ElephantBlueprint.json`.
   - Expect an error indicating that the name is protected and the import
     was not performed.
2. **Missing `meta.name`**:
   - Create a copy of `ElephantBlueprint.json` where `meta.name` is an
     empty string.
   - Import this file.
   - Expect an error message describing that `meta.name` must be set.
3. **Invalid JSON**:
   - Create a `.json` file with invalid JSON (e.g., plain text or truncated
     JSON).
   - Import this file.
   - Expect an error message indicating the payload is not valid JSON.

### 3.5 Basic viewport interaction

1. With any valid species loaded (Elephant or a test species):
   - Use the mouse to **orbit** the camera around the creature.
   - Use the scroll wheel or trackpad to **zoom** in and out.
   - Use middle‑mouse drag (or equivalent) to **pan** the view.
2. Confirm that:
   - The creature remains visible and does not “disappear” during normal
     navigation.
   - Shadows and lighting behave consistently as you move around.

---

## 4. Interpreting Failures

- **Backend test failures** usually point to changes in the blueprint
  schema, missing template files, or regressions in the new template/import
  flows.
- **Runtime smoke test failures** often indicate a breaking change in the
  runtime helper signatures, missing Three.js installation, or an invalid
  blueprint structure.
- **Manual QA failures** can be used to refine or add more automated tests
  in future phases.

Keep this checklist updated as the studio gains more features (animation
controls, additional species, music‑driven behaviours, etc.).
