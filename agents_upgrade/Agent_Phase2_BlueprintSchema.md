# Agent Instructions – Phase 2: Blueprint Schema Upgrade

You are executing **Phase 2** of the CreatureStudio upgrade.

## Phase Goal

Extend the `SpeciesBlueprint` schema (backend + frontend) so that it fully describes the Elephant’s body-part
geometry options currently hard-coded in the Zoo pipeline.

You are guided by: `Phase2_BlueprintSchema.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

1. **Read the plan file**
   - Open `Phase2_BlueprintSchema.md`.
   - Understand which geometry parameters must move into the blueprint (torso radii, leg radii, trunk/tusk taper,
     ear transforms, tail thickness, etc.).

2. **Update the backend schema**
   - Locate the Pydantic `SpeciesBlueprint` model in the CreatureStudio backend.
   - Add nested models for body-part options, for example:
     - `TorsoOptionsModel`
     - `LimbOptionsModel`
     - `NoseOptionsModel`
     - `TailOptionsModel`
   - Introduce a union/tagged type for `BodyPartOptions` if needed.
   - Add or update `meta.schemaVersion` (e.g., set to `"4.1.0"`).
   - Ensure all fields have reasonable defaults and are JSON-serializable.

3. **Update the frontend TypeScript types**
   - Find the TypeScript interfaces representing the blueprint in the frontend.
   - Mirror the backend models:
     - `TorsoOptions`, `LimbOptions`, etc.
     - Update `BodyPartDefinition` to accept typed `options`.
   - Keep naming and structure consistent with the backend models.

4. **Implement the Elephant blueprint upgrade script**
   - In the backend (or a `scripts/` directory), create a script like:
     - `scripts/upgrade_elephant_blueprint.py`
   - The script should:
     - Load `ElephantBlueprint.json`.
     - Inject the correct body-part options derived from the current Elephant generator defaults.
     - Update `meta.schemaVersion`.
     - Write out a new versioned file (e.g., `ElephantBlueprint.4.1.0.json` or overwrite with a backup).

5. **Validation**
   - Ensure the updated blueprint can be loaded by the backend without validation errors.
   - If there is any blueprint-loading path on the frontend, verify that types line up.

## Safety and Constraints

- Do not remove existing fields from the blueprint schema unless the plan explicitly allows it.
- Prefer additive changes plus versioning over destructive schema changes.
- If you must deprecate fields, keep them for now and mark them as such in comments/docs.

## Output Requirements

Your response for Phase 2 should include:

1. Full updated backend `SpeciesBlueprint` models and any new nested models.
2. Full updated TypeScript interfaces for blueprints in the frontend.
3. Full source of the `upgrade_elephant_blueprint` script.
4. A sample diff or snippet showing how `ElephantBlueprint.json` changed (before vs after).
5. Notes on any limitations or follow-up work needed in later phases.
