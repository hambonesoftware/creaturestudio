# Phase 5 – Implement Runtime Pipeline V2 and Integrate with Viewport

## Purpose

Wire the new anatomy generators and blueprints into a **Runtime Pipeline V2** that builds creatures
on demand in the CreatureStudio viewport, replacing legacy mesh construction paths.

## Objectives

1. Implement a **single entry-point** runtime function that builds a creature from a blueprint
   using the generalized anatomy system.
2. Integrate it with the existing CreatureStudio viewport and inspector.
3. Ensure that the Elephant and at least one winged creature render using the new pipeline.

## Tasks

1. **Implement the core runtime function**
   - In `frontend/src/runtime/` create or extend a module such as
     `CreatureRuntimeV2.ts` with a function:

     ```ts
     export interface BuildCreatureOptions {
       lowPoly?: boolean;
       variantSeed?: number;
     }

     export interface BuildCreatureResult {
       root: THREE.Object3D;
       mesh: THREE.SkinnedMesh;
       skeleton: THREE.Skeleton;
       bones: THREE.Bone[];
       meta: Record<string, unknown>;
     }

     export function buildCreatureFromBlueprintV2(
       blueprint: SpeciesBlueprint,
       options: BuildCreatureOptions
     ): BuildCreatureResult;
     ```

   - Inside this function:
     - Build the skeleton from blueprint bones.
     - Construct `AnatomyChain` objects from chain definitions.
     - For each body part definition:
       - Select the appropriate generator (`torsoGenerator`, `limbGenerator`, `wingGenerator`, etc.).
       - Call the generator with `{ skeleton, chain, options }`.
       - Collect geometries and any meta info.
     - Merge geometries and create a `SkinnedMesh`.
     - Apply materials (from blueprint materials section).
     - Bind skeleton to mesh and set up the root object.

2. **Integrate with viewport**
   - Replace any legacy mesh-building code used in the viewer with calls to
     `buildCreatureFromBlueprintV2`.
   - Ensure that:
     - When the user changes species or adjusts blueprint parameters, V2 flow is used.
     - Old pathways are removed or clearly marked as deprecated.

3. **Support V1 fallback (optional)**
   - If some species cannot yet be expressed in V2:
     - Add a temporary fallback so they can still render using legacy code.
     - Clearly mark this in code and documentation with TODOs for future migration.

4. **Performance & low-poly controls**
   - Allow global options (`lowPoly`, etc.) to be passed from the inspector to the runtime.
   - Ensure that V2 runtime can operate in:
     - Low-poly, faceted mode (Elephant-like).
     - Smooth, high-detail mode for other creatures.

5. **Logging & debugging**
   - Add non-intrusive debug logging (e.g., when chains or generators fail).
   - Provide an easy way to visualize chains and bone lines in the viewport (tied into
     existing debug toggles).

## Expected Outputs

- New runtime module implementing `buildCreatureFromBlueprintV2`.
- Updated viewport integration using V2 for at least: Elephant, a quadruped template, and a winged
  template.

## Success Criteria

- The app builds and runs with V2 as the primary creature construction pipeline.
- Elephant, a basic quadruped, and a winged species render correctly with no major regressions.
- No runtime imports from `zoo_reference` are used anywhere in the V2 runtime.
