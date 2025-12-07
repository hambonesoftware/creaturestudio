# Agent Instructions – Phase 4: Blueprint Schema and Body Plans

## Role in this Phase

You will evolve the **SpeciesBlueprint schema** and concrete species body plans so that the new
anatomy generators can be fully configured via blueprints (including Elephant and winged species).

## Steps

1. **Read the plan**
   - Open `Phase4_BlueprintSchemaAndBodyPlans.md` from `plan_upgrade.zip`.

2. **Update backend blueprint models**
   - Locate backend models for SpeciesBlueprint (likely Pydantic or similar).
   - Add or update fields for:
     - `chains: ChainDefinition[]`
     - `bodyParts: BodyPartDefinition[]`
     - Per-part options objects (`torsoOptions`, `limbOptions`, `wingOptions`, etc.).
   - Bump schema version (`meta.schemaVersion`) and ensure backward compatibility if required.

3. **Update frontend types**
   - Mirror these schema changes in TypeScript interfaces.
   - Ensure blueprint loading/validation on the frontend aligns with backend models.

4. **Define archetype body plans**
   - For quadruped, biped, winged, noped archetypes:
     - Create or update template blueprints in `shared/blueprints/` or a similar folder.
     - Define chains (spine, legs, wings, tail, trunk, etc.).
     - Configure body parts using generator type keys (`"torso"`, `"limb"`, `"wing"`, etc.).

5. **Upgrade Elephant blueprint**
   - Update the Elephant blueprint to:
     - Define all necessary chains (spine, legs, trunk, tail, ears).
     - Assign generators for each body part using the new schema.
     - Set options approximating the Zoo elephant look (torso radii, leg radius stacks,
       rump bulge, etc.).

6. **Add/upgrade a winged blueprint**
   - Select a winged species (or create one).
   - Define wing chains and set the `wingGenerator` with initial options.
   - Ensure it loads without errors.

## Phase Completion Criteria
- Backend and frontend blueprint schemas compile and align.
- Elephant blueprint uses the new schema and references the general generators.
- At least one winged species blueprint uses `wingGenerator` and passes basic validation.
