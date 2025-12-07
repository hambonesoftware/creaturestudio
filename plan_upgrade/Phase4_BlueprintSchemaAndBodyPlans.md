# Phase 4 – Upgrade Blueprint Schema and Body Plans

## Purpose

Extend the CreatureStudio blueprint schema to fully describe the anatomy generators from Phase 3,
and update body plans for all archetypes (quadruped, biped, winged, nopeds) to use the new
generalized pipeline.

## Objectives

1. Evolve the **SpeciesBlueprint** (backend model + frontend types) to express:
   - Bone chains.
   - Body-part assignments (which generator to use).
   - Generator options (TorsoOptions, LimbOptions, WingOptions, etc.).
2. Update Elephant and other species blueprints to use the new schema.
3. Maintain migration compatibility or provide a clear migration path from older versions.

## Tasks

1. **Update backend blueprint models**
   - Locate the backend schema (e.g., Pydantic models) for blueprints.
   - Add nested models for:
     - `ChainDefinition` – `{ name: string, bones: string[] }`
     - `BodyPartDefinition` – `{ name, generatorType, chainName, options }`
     - Option objects for torso/limb/wing/etc., aligned with Phase 2 types.
   - Version the schema, e.g., `meta.schemaVersion: "4.1.0"` or similar.
   - Ensure JSON (de)serialization handles default values gracefully.

2. **Update frontend blueprint types**
   - Mirror backend changes in TypeScript interfaces under `frontend/src/models/` or similar.
   - Ensure that editor components and runtime loader use the new types.

3. **Define canonical body plan templates**
   - For each archetype:
     - Quadruped (e.g., Elephant, Cat).
     - Biped (humanoid-like).
     - Winged (dragon/bird-like).
     - NoPed (snake/worm-like).
   - Create template blueprints (or shared config) that define:
     - Chains (spine, legs, wings, tails).
     - Body parts and generator assignments.
     - Baseline options (radii arrays, detail levels).

4. **Upgrade existing Elephant blueprint**
   - Modify the Elephant blueprint to:
     - Declare the full set of chains (spine, front/back legs, trunk, tail, ears).
     - Map each chain to the correct generator:
       - `torsoGenerator` for spine chain.
       - `limbGenerator` for each leg chain.
       - `trunkGenerator`, `tailGenerator`, `earGenerator` etc.
     - Provide options that, when passed to generators, approximate the Zoo elephant look.
   - Update any migration or loader logic so it can handle both older and new Elephant blueprints
     if required.

5. **Add or update winged species blueprint**
   - Pick an existing winged species entry or create a new one.
   - Define wing chains and assign the `wingGenerator` with reasonable options.
   - Ensure it loads and renders in the CreatureStudio viewport.

## Expected Outputs

- Updated backend and frontend blueprint schemas.
- Migrated Elephant blueprint using generalized anatomy generators.
- At least one blueprint per archetype updated or created using the new schema, including a
  winged example.

## Success Criteria

- All upgraded blueprints can be loaded without errors.
- The inspector/viewport can still switch between species and show their body plans, even if
  visual tuning isn’t perfect yet.
- The Elephant blueprint expresses all necessary anatomy details for later visual matching to
  the Zoo elephant.
