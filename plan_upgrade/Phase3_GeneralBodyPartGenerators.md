# Phase 3 – Implement General Body-Part Generators

## Purpose

Implement reusable body-part generators (`torsoGenerator`, `limbGenerator`, `wingGenerator`, etc.)
inside CreatureStudio, based on the patterns from `zoo_reference/bodyParts/`, using the anatomy
abstractions designed in Phase 2.

These generators will be the backbone of the **general creature pipeline**.

## Objectives

1. Implement concrete generators under `frontend/src/anatomy/generators/` using Three.js.
2. Ensure they can reproduce the Zoo elephant’s geometry characteristics when given appropriate
   options (particularly for the torso and legs).
3. Implement a **`wingGenerator`** capable of building wing-like geometry around wing bones,
   suitable for any winged blueprint.

## Tasks

1. **Implement `torsoGenerator`**
   - Port the conceptual logic from `zoo_reference/bodyParts/TorsoGenerator` into
     `frontend/src/anatomy/generators/torsoGenerator.ts`:
     - Sample along a chain of spine bones.
     - Build ring-based geometry with radius profiles and optional rump extensions.
     - Support low-poly vs smooth via `segmentsAround`, `segmentsAlong`, and weld tolerance.
     - Assign `skinIndex` / `skinWeight` based on proximal bones.
   - Test locally (conceptually or with minimal dev tooling) to ensure:
     - Ring alignment is correct.
     - Skinning roughly matches elephant expectations.

2. **Implement `limbGenerator`**
   - Based on `zoo_reference` limb generator(s), implement a generic `limbGenerator` that:
     - Takes a chain for front/back legs or arms.
     - Uses radii arrays to create stacked segments (e.g., hoof/ankle/knee/hip).
     - Supports low-poly vs smooth.
   - Ensure that, with Elephant-specific radii, this generator can produce the chunky leg look.

3. **Implement `wingGenerator`**
   - Using patterns from limb generators and any wing-like reference in `zoo_reference`:
     - Define geometry logic that:
       - Spans between an upper wing bone chain and an optional lower “finger” chain, or
         approximates a simple membrane.
       - Uses `WingOptions` for span, membrane resolution, and curvature.
       - Assigns skinning to wing bones such that bending/posing works reasonably.
   - Implement `wingGenerator` in `frontend/src/anatomy/generators/wingGenerator.ts`.

4. **Implement other key generators**
   - Head / neck generator (`headGenerator`, `neckGenerator`).
   - Tail generator (`tailGenerator`).
   - Nose/trunk generator (`trunkGenerator` or `noseGenerator`), leveraging Elephant trunk logic.
   - Ear generator (`earGenerator`) for plate-like meshes attached to ear bones.

5. **Create unit-style sanity tests (optional but recommended)**
   - Under a test directory (e.g., `frontend/src/anatomy/__tests__/`):
     - Create a few simple skeleton stubs and ensure each generator:
       - Produces a non-empty geometry.
       - Has matching `skinIndex`/`skinWeight` array lengths.
       - Does not throw in basic configurations.

## Expected Outputs

- Concrete generator modules in `frontend/src/anatomy/generators/` implementing the core anatomy
  logic.
- Optional helper functions in `core/` (sampling, skinning, radius profiles) factored out of
  generators where appropriate.

## Success Criteria

- Given:
  - A simple synthetic skeleton and basic options,
- Each generator can produce a plausible, skinned geometry for its body part type.
- For the Elephant spine + leg chains, `torsoGenerator` and `limbGenerator` can be tuned via
  options to visually resemble the Zoo elephant segments when integrated in later phases.
- No runtime imports from `zoo_reference` exist in these new modules.
