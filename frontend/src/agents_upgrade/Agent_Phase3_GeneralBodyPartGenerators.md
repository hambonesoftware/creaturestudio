# Agent Instructions – Phase 3: Implement General Body-Part Generators

## Role in this Phase

You will implement the **actual geometry logic** for core generators (torso, limb, wing, etc.)
inside CreatureStudio, inspired by but not importing from `zoo_reference`.

## Steps

1. **Read the plan**
   - Open `Phase3_GeneralBodyPartGenerators.md` from `plan_upgrade.zip`.

2. **Implement `torsoGenerator`**
   - In `frontend/src/anatomy/generators/torsoGenerator.ts`:
     - Use `AnatomyChain` and `TorsoOptions` types.
     - Implement ring-based tube generation along the chain:
       - Sample positions along the bones (use `core/sampling.ts`).
       - Create circular rings with radii from options (including profiles).
       - Add rump bulge / rump extension concepts where options specify.
     - Assign skin indices and weights based on nearest bones (use `core/skinning.ts`).

3. **Implement `limbGenerator`**
   - In `limbGenerator.ts`:
     - Build stacked segments along a leg/arm chain using radii arrays.
     - Support low-poly and smooth modes.
     - Ensure proper skinning so bending joints behaves correctly.

4. **Implement `wingGenerator`**
   - In `wingGenerator.ts`:
     - Construct a wing membrane or segment structure from wing bones.
     - Use `WingOptions` (span, chord, resolution, etc.) to shape geometry.
     - Assign skinning such that flapping poses deform reasonably across the membrane.

5. **Implement remaining generators (head, tail, trunk, ear, etc.)**
   - Implement enough logic to create plausible shapes for these parts.
   - Use simpler shapes if needed, but keep options flexible.

6. **Sanity tests (if test harness exists)**
   - Add tests in `frontend/src/anatomy/__tests__/` that:
     - Create small synthetic skeletons/chains.
     - Call generators with basic options.
     - Assert non-empty geometries and attribute consistency.

7. **No zoo_reference imports**
   - Ensure no code in `frontend/src/anatomy/**` imports from `zoo_reference`.

## Phase Completion Criteria
- Generators are implemented and compile.
- Synthetic tests (if any) pass.
- The generators are ready to be driven by blueprints in Phase 4 and 5.
