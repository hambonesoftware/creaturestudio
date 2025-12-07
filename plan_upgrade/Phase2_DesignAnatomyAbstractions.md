# Phase 2 – Design General Anatomy Abstractions

## Purpose

Take the findings from Phase 1 and design a **clean, reusable anatomy layer** for CreatureStudio
that can support Elephant and all other creatures (including winged animals) using a common set of
interfaces and data structures.

This phase may involve creating **interface and type definitions**, but should still avoid heavy
runtime changes.

## Objectives

1. Define **core anatomy interfaces** for body-part generators and bone chains.
2. Design a **module layout** under `frontend/src/` (and possibly shared model definitions) for
   this anatomy layer.
3. Ensure the design can be driven entirely by **blueprint data** and does not depend on
   `zoo_reference` at runtime.

## Tasks

1. **Define anatomy core types**
   - In a new module such as `frontend/src/anatomy/types.ts` (or a similar location), design
     TypeScript interfaces for:
     - `AnatomyChain` – reference to a chain of bones:
       - `name`
       - `boneNames: string[]`
       - world/local positions, if needed.
     - `AnatomyGeneratorOptions` – base options for all generators (detail, lowPoly, weld
       tolerance, material hints).
     - `TorsoOptions`, `LimbOptions`, `WingOptions`, `TailOptions`, `HeadOptions` etc. –
       per-part option types reflecting the patterns found in `zoo_reference`.
     - `AnatomyGenerator<TOptions>` – generic function signature:
       - Input: `{ skeleton, chain: AnatomyChain, options: TOptions }`
       - Output: `{ geometry: THREE.BufferGeometry, meta?: Record<string, unknown> }`

2. **Plan anatomy module layout**
   - Propose a folder layout like:

     ```text
     frontend/src/anatomy/
       core/
         types.ts
         chains.ts       # utilities for building chains from skeleton & blueprints
         sampling.ts     # sample positions/radii along bones
         skinning.ts     # helpers for skinIndex / skinWeight assignment
       generators/
         torsoGenerator.ts
         limbGenerator.ts
         wingGenerator.ts
         tailGenerator.ts
         headGenerator.ts
         finGenerator.ts (optional)
     ```

   - Write brief comments in each file (or in a `README.md`) describing its intended role.

3. **Map Elephant concepts into anatomy options**
   - Using Phase 1 notes, decide how to represent Elephant-specific features as options:
     - Rump bulge depth.
     - Rump extension to rear legs.
     - Hip ring radius pattern.
     - Trunk taper and segment counts.
     - Ear flap thickness / curvature.
   - These should be expressible using generic types (`TorsoOptions`, `LimbOptions`,
     `WingOptions` etc.), not Elephant-only flags.

4. **Consider winged creatures explicitly**
   - Based on any wing logic in `zoo_reference` (or, if absent, analogous limb logic):
     - Define `WingOptions` with things like:
       - span
       - thickness profile
       - membrane resolution
       - feather/segment hints (even if not fully implemented yet)
   - Ensure the **wing generator** concept can create a wing mesh around a chain of wing bones
     for any winged animal blueprint.

5. **Document the anatomy API design**
   - Create `docs/anatomy_design_v2.md` describing:
     - The anatomy core types and generator interfaces.
     - How blueprints will reference chains and select generators.
     - Example: how the Elephant torso, a quadruped leg, and a wing would be represented.

## Expected Outputs

- New TypeScript definitions and placeholder modules under `frontend/src/anatomy/`.
- A design document outlining the anatomy API and its intended usage.
- No changes yet to existing runtime creature construction (that will come in later phases).

## Success Criteria

- The anatomy abstractions cover at least:
  - Torso
  - Limb (front/back leg, arm)
  - Wing
  - Tail
  - Head
  - (Optionally) fin/ear/nose variants.
- The design is clearly decoupled from `zoo_reference` and is fully driven by skeleton & blueprint data.
