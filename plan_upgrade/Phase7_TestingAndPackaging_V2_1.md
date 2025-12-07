# Phase 7 – Testing, Validation, and Packaging CreatureStudioV2.1

## Purpose

Validate the new general creature pipeline, ensure no major regressions, and package the upgraded
project as **CreatureStudioV2.1.zip** for delivery.

## Objectives

1. Add and/or run tests that exercise the new anatomy and runtime pipeline.
2. Verify Elephant and winged creatures visually and functionally.
3. Produce a clean, reproducible zip archive of the upgraded repo.

## Tasks

1. **Automated tests**
   - Run existing test suite(s) (lint, type-check, unit tests).
   - Add small targeted tests where gaps exist, such as:
     - Skeleton + chains construction from blueprints.
     - Body-part generators producing non-empty geometries with consistent attributes.
     - `buildCreatureFromBlueprintV2` successfully building at least:
       - Elephant
       - One quadruped template
       - One winged template
   - Ensure all tests pass.

2. **Visual validation**
   - In a running dev build (or conceptually via code inspection if execution is limited):
     - Load Elephant and compare its silhouette and low-poly style to the Zoo elephant reference
       screenshots/docs.
     - Load at least one winged creature and ensure wings look plausible and animate/pose properly
       when bones are manipulated (if supported).
   - Note any remaining visual discrepancies; either fix them or document as known issues.

3. **Regression checks**
   - Confirm that:
     - Non-winged, non-Elephant species still render (either via V2 or legacy fallback).
     - Editor panels work without crashing across several species.
     - No runtime imports reference `zoo_reference`.

4. **Packaging CreatureStudioV2.1.zip**
   - From the upgraded working tree:
     - Remove build artifacts and `node_modules` (if necessary) to keep archive size reasonable.
     - Zip the project folder as **CreatureStudioV2.1.zip** at the root.
   - Verify that the zip, when extracted into a fresh environment, contains:
     - All source code and configuration needed to run the app, matching the V2.1 state.

5. **Write a short CHANGELOG**
   - Create or update `CHANGELOG.md` with a `V2.1` entry summarizing:
     - New general anatomy pipeline.
     - New runtime V2.
     - Updated blueprints and wing support.
     - Any breaking changes and migration notes.

## Expected Outputs

- Passing test suite that covers critical anatomy and runtime paths.
- A zip file named `CreatureStudioV2.1.zip` containing the upgraded project.
- A concise changelog summarizing user-visible improvements.

## Success Criteria

- The agent (or human reviewer) can open CreatureStudioV2.1, run it, and:
  - Load Elephant and multiple other species.
  - See creatures built via the new anatomy/runtime pipeline.
  - Confirm that the app is stable and that the `zoo_reference` folder is used only as
    documentation/reference, not as an imported runtime dependency.
