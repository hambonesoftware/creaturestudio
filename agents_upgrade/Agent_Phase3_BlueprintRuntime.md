# Agent Instructions – Phase 3: General Blueprint Creature Runtime

You are executing **Phase 3** of the CreatureStudio upgrade.

## Phase Goal

Implement a general `buildCreatureFromBlueprint` runtime that takes a `SpeciesBlueprint` and produces
a `THREE.SkinnedMesh` and optional behavior controller, using the shared anatomy library (Phase 1)
and updated schema (Phase 2). Wire this runtime into the CreatureStudio viewport.

You are guided by: `Phase3_BlueprintRuntime.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

1. **Read the plan file**
   - Open `Phase3_BlueprintRuntime.md`.
   - Understand the desired runtime API and responsibilities.

2. **Create the runtime module**
   - In `creaturestudio`, create a new runtime file, for example:
     - `frontend/src/runtime/BlueprintCreatureRuntime.ts`
   - Implement:
     - `RuntimeOptions` interface.
     - `CreatureBuildResult` interface (skeleton, mesh, controller).
     - `buildCreatureFromBlueprint(blueprint, options)` function.

3. **Implement runtime steps**

   a. **Skeleton construction**
      - Use `blueprint.skeleton` to construct a hierarchy of `THREE.Bone` objects.
      - Set parent-child relationships as defined in the blueprint.
      - Create a `THREE.Skeleton` from the bones.

   b. **Body-part geometry assembly**
      - Iterate over `blueprint.bodyParts`.
      - For each part:
        - Resolve its `chain` to a list of bones via `blueprint.chains`.
        - Choose the correct generator function from the anatomy library based on `generator`.
        - Call the generator with the skeleton, chain, and `options`.
      - Collect all resulting geometries and metadata required for material assignment.

   c. **Geometry merge and SkinnedMesh creation**
      - Ensure all part geometries expose: `position`, `normal`, `uv`, `skinIndex`, `skinWeight`.
      - Merge geometries with `BufferGeometryUtils.mergeGeometries`.
      - Create a `THREE.SkinnedMesh` from the merged geometry and a placeholder material.
      - Bind the skeleton to the mesh.

   d. **Materials**
      - Use `blueprint.materials` to build material(s) (e.g., `MeshStandardMaterial`, NodeMaterials).
      - Assign materials to the mesh (using geometry groups if multiple materials are needed).

   e. **Behavior controller (stub for now)**
      - Add a placeholder step that will later be replaced by the behavior registry (Phase 5).
      - For now, `controller` can safely be `null` or a simple idle animator if easily available.

4. **Integrate runtime into the viewport**
   - Find the CreatureStudio 3D viewport component.
   - Replace any simple/demo mesh creation with:
     - Loading a blueprint from the backend.
     - Calling `buildCreatureFromBlueprint(blueprint, options)`.
     - Adding the returned mesh and bones to the scene.
   - Ensure that when the selected blueprint changes, the runtime is re-run and the viewport updates.

5. **Error handling**
   - If a body part references a missing chain or unknown generator:
     - Log a clear error message.
     - Skip that part rather than crashing the entire app.
   - Consider adding simple runtime assertions with helpful messages.

## Safety and Constraints

- Do not modify the anatomy library in a way that breaks Zoo’s Elephant behavior.
- Keep the runtime modular and testable.
- If you must introduce temporary hacks, mark them clearly with comments and TODOs.

## Output Requirements

Your response for Phase 3 should include:

1. Full source code of `BlueprintCreatureRuntime.ts` (or equivalent runtime file).
2. Diffs or full updated viewport component(s) that now invoke the runtime.
3. A textual walkthrough of how an Elephant blueprint flows through the new runtime.
4. Known limitations (e.g., partial material support, missing behaviors) and which later phases will address them.
