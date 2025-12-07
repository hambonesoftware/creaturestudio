# Agent Instructions – Phase 7: Testing, Validation, and Packaging CreatureStudioV2.1

## Role in this Phase

You will verify the correctness of the new general pipeline, ensure no major regressions, and
package the upgraded project as **CreatureStudioV2.1.zip**.

## Steps

1. **Read the plan**
   - Open `Phase7_TestingAndPackaging_V2_1.md` from `plan_upgrade.zip`.

2. **Run and/or add tests**
   - Run existing tests (lint, type-check, unit/integration tests) if possible.
   - Add minimal tests for:
     - Anatomy chain construction from blueprints.
     - Body-part generators producing valid geometries with proper attributes.
     - `buildCreatureFromBlueprintV2` successfully building Elephant, a quadruped template,
       and a winged template.

3. **Visual checks**
   - In a dev build (if runnable):
     - Load Elephant and visually compare it to Zoo reference screenshots or notes.
     - Load a winged creature and confirm wings look plausible and respond to limb poses.
   - Note any significant discrepancies; fix if feasible or document as known limitations.

4. **Regression sweep**
   - Spot-check non-winged species to ensure they still render and the editor behaves.
   - Confirm that `zoo_reference` is not imported anywhere at runtime.

5. **Package CreatureStudioV2.1.zip**
   - From the upgraded project root:
     - Exclude heavy build artifacts and node_modules if appropriate.
     - Create a zip archive named **CreatureStudioV2.1.zip** containing the full source tree
       and necessary config files.
   - Verify the archive’s structure (top-level folders like `backend/`, `frontend/`, `shared/`,
     `zoo_reference/`, `docs/`, etc.).

6. **Update CHANGELOG**
   - Add a `V2.1` section to `CHANGELOG.md` summarizing:
     - New general anatomy system and runtime V2.
     - Elephant and winged pipeline improvements.
     - Any breaking changes or notable migrations.

## Phase Completion Criteria
- Tests (old + new) pass successfully or have documented reasons for any failures.
- CreatureStudioV2.1.zip exists and contains the upgraded project.
- The upgrade story from V2.0 to V2.1 is understandable via the changelog and docs.
