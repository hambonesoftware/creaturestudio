# Agent Instructions – Phase 5: Runtime Pipeline V2 and Viewport Integration

## Role in this Phase

You will connect the new anatomy generators and upgraded blueprints into a **Runtime Pipeline V2**
that actually builds creatures in the viewport, replacing legacy mesh construction.

## Steps

1. **Read the plan**
   - Open `Phase5_RuntimePipelineV2.md` from `plan_upgrade.zip`.

2. **Create/extend runtime module**
   - Implement `buildCreatureFromBlueprintV2` in `frontend/src/runtime/CreatureRuntimeV2.ts`
     (or similar):
     - Build skeleton from blueprint bones.
     - Construct `AnatomyChain` objects for each chain definition.
     - For each body part definition:
       - Look up the correct generator module.
       - Call the generator with appropriate options.
       - Collect geometries.
     - Merge geometries into a single `BufferGeometry` (using BufferGeometryUtils).
     - Create `THREE.SkinnedMesh` and bind skeleton.
     - Apply materials from blueprint.

3. **Integrate with viewport**
   - Find the current creature-building path (e.g., in `frontend/src/components/Viewport` or
     similar).
   - Replace or wrap legacy mesh creation with calls to `buildCreatureFromBlueprintV2` for
     species that support it (Elephant and archetype templates).
   - Maintain a safe fallback for species not yet migrated, if necessary.

4. **Wire quick-adjust options**
   - Ensure that inspector changes to body-part or global anatomy options:
     - Update the blueprint data in state.
     - Trigger a rebuild via `buildCreatureFromBlueprintV2`.

5. **Debug and logging**
   - Add optional debug output (e.g., chain names, part counts) when building creatures.
   - Honor existing debug toggles for skeleton, bone lines, chain highlighting, and part isolation.

## Phase Completion Criteria
- Elephant, at least one quadruped template, and one winged template are constructed via
  `buildCreatureFromBlueprintV2` in the viewport.
- Legacy mesh construction code is either removed or clearly marked as deprecated.
- No runtime imports from `zoo_reference` exist in the runtime.
