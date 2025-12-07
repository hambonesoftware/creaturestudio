# Agent Instructions – Phase 2: Design General Anatomy Abstractions

## Role in this Phase

You are defining the **anatomy API**: TypeScript types, interfaces, and module layout that will
power generalized body-part generators. You may create new source files, but you should not yet
rewrite the existing runtime pipeline.

## Steps

1. **Read the plan**
   - Open `Phase2_DesignAnatomyAbstractions.md` from `plan_upgrade.zip`.

2. **Create anatomy core types**
   - Add a new module, e.g. `frontend/src/anatomy/core/types.ts`.
   - Define interfaces such as:
     - `AnatomyChain`
     - `AnatomyGeneratorOptions`
     - `TorsoOptions`, `LimbOptions`, `WingOptions`, `TailOptions`, `HeadOptions`, etc.
     - `AnatomyGenerator<TOptions>`
   - Use patterns identified in Phase 1 (chains, radii, profiles, lowPoly flags, etc.).

3. **Add supporting core modules (skeleton/chains helpers)**
   - Create placeholder or initial implementation files, for example:
     - `frontend/src/anatomy/core/chains.ts`
     - `frontend/src/anatomy/core/sampling.ts`
     - `frontend/src/anatomy/core/skinning.ts`
   - Include minimal but logically correct helpers (even if they are stubs to be expanded in
     Phase 3). Add detailed comments about intended behavior.

4. **Plan generator modules**
   - Create stub modules under `frontend/src/anatomy/generators/`:
     - `torsoGenerator.ts`
     - `limbGenerator.ts`
     - `wingGenerator.ts`
     - `tailGenerator.ts`
     - `headGenerator.ts`
     - `noseGenerator.ts`/`trunkGenerator.ts`
     - `earGenerator.ts`
   - For now, you may only export function signatures and TODO comments referencing the
     appropriate sections in `zoo_reference`.

5. **Documentation**
   - Create or update `docs/anatomy_design_v2.md` with:
     - Description of each core type.
     - How generators will be plugged in.
     - Example of mapping an Elephant spine + legs + trunk into these types.

## Prohibited Actions
- Do not modify the existing CreatureStudio runtime logic yet.
- Do not import from `zoo_reference`.

## Phase Completion Criteria
- Anatomy core and generator stub files exist with clear, well-documented interfaces.
- `docs/anatomy_design_v2.md` describes how the new anatomy layer will work and how Elephants
  and winged animals will use it.
