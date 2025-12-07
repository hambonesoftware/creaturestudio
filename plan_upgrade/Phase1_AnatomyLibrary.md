# Phase 1 – Shared Anatomy Library (Body-Part Generators)

## Purpose

Extract all the reusable geometry-generation logic (torso, limbs, head, trunk, tusks, tail, ears, etc.) into a
shared “anatomy library” that both Zoo and CreatureStudio can call. This becomes the backbone of the
CreatureStudio runtime.

## Objectives

1. **Identify reusable body-part generators from Zoo**
   - Torso generator (with support for different radius profiles and rump extensions).
   - Neck generator.
   - Head generator.
   - Nose/Trunk/Tusk generator.
   - Limb generator (front/rear legs with radius stacks).
   - Tail generator.
   - Optional: simple fin/wing/ear generators if already present in any form.

2. **Design clean TypeScript/JavaScript interfaces**
   - Each generator should expose a well-typed options object that maps cleanly to JSON:
     - `TorsoOptions`, `NeckOptions`, `HeadOptions`, `LimbOptions`, `NoseOptions`, `TailOptions`, etc.
   - Options should include:
     - Geometry complexity (sides, segments).
     - Radii arrays per bone segment.
     - Per-species flags (e.g., `rumpBulgeDepth`, `extendRumpToRearLegs`, `earFlattenProfile`).

3. **Create a new shared module in CreatureStudio**
   - Proposed folder structure:
     - `frontend/src/anatomy/`
       - `TorsoGenerator.ts`
       - `NeckGenerator.ts`
       - `HeadGenerator.ts`
       - `LimbGenerator.ts`
       - `NoseGenerator.ts`
       - `TailGenerator.ts`
       - `profiles.ts` (standard radius profiles, ear transforms, etc.)
   - Each generator should:
     - Take a `THREE.Skeleton` and a list of bone names or transforms.
     - Return a well-formed `THREE.BufferGeometry` with `position`, `normal`, `uv`, `skinIndex`, `skinWeight`.

4. **Keep Zoo running while extracting**
   - Strategy:
     - Copy the logic into CreatureStudio first (as-is, but organized and typed).
     - Update Zoo to import from a shared package or shared folder (if using a monorepo or a Git submodule).
     - Gradually delete local copies from Zoo once the shared version is verified.

## Implementation Steps

1. **Code extraction**
   - Identify the exact files and functions in Zoo that build the elephant body parts.
   - Copy them into CreatureStudio, preserving behavior but adapting to TypeScript if needed.
   - Add a thin adapter layer if the original functions assume certain global state.

2. **Refine interfaces**
   - Introduce explicit interfaces/types for options.
   - Remove implicit dependencies on specific species (e.g., hard-coded bone names) and replace with parameters.

3. **Testing the library in isolation**
   - Create a small dev-only script or Storybook-like page that:
     - Instantiates a test skeleton.
     - Calls each generator independently.
     - Renders the result in a viewport grid (torso-only, leg-only, head-only, etc.).
   - Validate:
     - No missing attributes.
     - Reasonable default shapes.
     - Skinning works (bones actually deform the mesh under animation).

4. **Update Zoo to use the new library**
   - Replace calls to the old, inline functions with calls to the shared anatomy library.
   - Confirm that the rendered elephant in Zoo is unchanged.

## Success Criteria

- All body-part generation logic for the elephant lives in the shared anatomy library.
- Zoo’s elephant renders identically before and after the refactor.
- The anatomy library can generate plausible shapes when given generic options (no hard dependency on Elephant).

## Risks

- **Hidden coupling to Elephant-specific assumptions:** mitigate via explicit options and unit tests for more generic cases.
- **TypeScript migration complexity:** mitigate by keeping the first cut as close to the original JS as possible,
  then cleaning up once tests are in place.

## Checklists

- [ ] Torso generator extracted and typed.
- [ ] Neck generator extracted and typed.
- [ ] Head generator extracted and typed.
- [ ] Limb generator extracted and typed.
- [ ] Nose/Trunk/Tusk generator extracted and typed.
- [ ] Tail generator extracted and typed.
- [ ] Zoo elephant verified against before/after screenshots or golden images.
