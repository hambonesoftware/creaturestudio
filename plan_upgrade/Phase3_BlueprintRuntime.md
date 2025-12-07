# Phase 3 – General Blueprint Creature Runtime

## Purpose

Implement a general `buildCreatureFromBlueprint` runtime in CreatureStudio that can take any valid
`SpeciesBlueprint` and produce a `THREE.SkinnedMesh` and an optional behavior controller, using the
shared anatomy library created in Phase 1 and the schema from Phase 2.

## Objectives

1. **Create a single entry point runtime**
   - A function such as `buildCreatureFromBlueprint(blueprint, options)` that:
     - Builds the skeleton.
     - Calls body-part generators.
     - Merges geometries.
     - Creates materials.
     - Binds the mesh to the skeleton.
     - Optionally sets up behavior.

2. **Integrate with the existing CreatureStudio viewport**
   - Replace any ad-hoc or “smoke test” geometry creation with the new runtime.
   - Ensure reactivity: when a blueprint is reloaded or switched, the viewport updates using the runtime.

3. **Handle errors gracefully**
   - Invalid chains, missing bones, or unknown generators should produce clear errors or fallbacks,
     not crash the app.

## Runtime Design

### Public interface

```ts
export interface RuntimeOptions {
  lowPoly?: boolean;
  variantSeed?: number;
}

export interface CreatureBuildResult {
  skeleton: THREE.Skeleton;
  mesh: THREE.SkinnedMesh;
  controller: CreatureController | null;
}

export function buildCreatureFromBlueprint(
  blueprint: SpeciesBlueprint,
  options: RuntimeOptions = {}
): CreatureBuildResult;
```

### Steps

1. **Skeleton construction**
   - Read `blueprint.skeleton.bones` and create `THREE.Bone` instances.
   - Respect parent-child relationships and initial local transforms.
   - Create a `THREE.Skeleton` from the bone list.
   - Return a root `THREE.Object3D` that holds the skinned mesh and the bone hierarchy.

2. **Body-part geometry assembly**
   - For each entry in `blueprint.bodyParts`:
     - Resolve the `chain` to a sequence of bones using `blueprint.chains`.
     - Look up the generator name (`"torso"`, `"limb"`, `"head"`, etc.).
     - Call the corresponding anatomy function, passing:
       - Skeleton, chain bones, and the per-part options.
   - Collect all returned `BufferGeometry` instances along with their intended material assignments.

3. **Geometry merge and skinning**
   - Ensure each part geometry has proper attributes:
     - `position`, `normal`, `uv`, `skinIndex`, `skinWeight`.
   - Use `BufferGeometryUtils.mergeGeometries` to create a single merged geometry.
   - Create a `THREE.SkinnedMesh` with the merged geometry and a placeholder material.

4. **Materials**
   - Read `blueprint.materials`:
     - Create PBR materials (e.g., `MeshStandardMaterial`) or NodeMaterials as needed.
     - If multiple materials are required, use groups in the merged geometry to assign them.
   - For Elephant, optionally use a specialized elephant skin material if the blueprint indicates.
   - Apply the material(s) to the `SkinnedMesh`.

5. **Behavior/controller setup**
   - Call a behavior factory function (to be implemented in Phase 5) based on `blueprint.behaviorPresets`.
   - Attach any necessary state to drive animation (e.g., locomotion, idle sway).

6. **Return value**
   - Return `{ skeleton, mesh, controller }` to the caller, where the caller is the viewport scene manager.

## Integration into CreatureStudio

- Update the React/Vue/Svelte (whichever is used) component responsible for the 3D viewport to:
  - Fetch the selected blueprint from the backend.
  - Call `buildCreatureFromBlueprint`.
  - Add the returned `mesh` and `skeleton.bones[0]` (root) to the Three.js scene.
  - Drive the controller’s `update(deltaTime)` from the animation loop if present.

## Success Criteria

- Any valid blueprint can be loaded and rendered without custom per-species code.
- Elephant via blueprint looks reasonable even before full Phase 4 visual alignment.
- Errors in blueprints produce readable logs and do not crash the entire app.

## Risks

- **Complexity of merging materials and geometries:** mitigate via incremental implementation and testing.
- **Difficult debugging of runtime failures:** mitigate with extensive logging and small debug tools
  (e.g., bone visualizers and chain highlighters).

## Checklists

- [ ] `buildCreatureFromBlueprint` implemented and exported.
- [ ] Viewport integrated with runtime.
- [ ] Basic error-handling implemented.
- [ ] At least one non-elephant blueprint successfully rendered end-to-end.
