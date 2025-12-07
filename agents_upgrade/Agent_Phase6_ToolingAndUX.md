# Agent Instructions – Phase 6: Tooling, Validation, and Authoring UX

You are executing **Phase 6** of the CreatureStudio upgrade.

## Phase Goal

Add validation, debug visualization, and documentation so that the new blueprint-driven creature pipeline is
safe, debuggable, and pleasant to author new species with.

You are guided by: `Phase6_ToolingAndUX.md` in `plan_upgrade.zip`.

## Step-by-Step Instructions

1. **Read the plan file**
   - Open `Phase6_ToolingAndUX.md`.
   - Understand the validation rules, debug tools, and documentation targets.

2. **Implement a blueprint validator (backend)**
   - Create a script such as `scripts/validate_blueprints.py`.
   - It should:
     - Load all blueprint JSON files from the appropriate directory.
     - Validate:
       - All `bodyParts.*.chain` names exist in `chains`.
       - All chains reference valid bones from `skeleton.bones`.
       - All `generator` values match known generators in the anatomy library.
       - Numeric fields fall within reasonable ranges.
       - Behavior IDs in `behaviorPresets` map to known behavior registry entries (or are clearly flagged).
     - Print a summary and exit with non-zero status on errors (for CI integration).

3. **Add debug visualization tools (frontend)**
   - In the CreatureStudio viewport:
     - Add a toggle to visualize bones (draw lines or simple markers between parent and child).
     - Add a way to highlight a specific chain (e.g., “spine”, “front_left_leg”) using a distinct color.
     - Optionally, add a mode to isolate and render a single body part (e.g., the torso) for debugging geometry.

4. **Enhance the Inspector for authoring UX**
   - In the right-hand Inspector panel:
     - Show resolved `bodyParts` information:
       - Generator type.
       - Chain name.
       - Key options (e.g., sides, radii, rumpBulgeDepth).
     - Show `behaviorPresets` and the resolved behavior ID from the registry.
   - Keep this read-only for now, unless the plan explicitly adds editing.

5. **Authoring documentation**
   - Under a `docs/` or `animalrulebook/` folder, create:
     - `BlueprintFormat.md`:
       - Explain the schema: `meta`, `skeleton`, `chains`, `bodyParts`, `materials`, `behaviorPresets`.
     - `CreatingANewSpecies.md`:
       - Step-by-step instructions for building a new species from a template.
     - `BehaviorAuthoring.md`:
       - How to define new behavior presets and register behavior controllers.

6. **CI or pre-commit integration (optional)**
   - If appropriate, add a small CI step or pre-commit hook that runs the blueprint validator and fails if there
     are errors.

## Safety and Constraints

- Debug tools should be easy to disable and should not significantly impact performance when off.
- Documentation must reflect the current state of the schema and runtime; avoid stale or speculative information.
- Do not introduce breaking validation rules without providing a way to fix existing blueprints.

## Output Requirements

Your response for Phase 6 should include:

1. Full source of `scripts/validate_blueprints.py`.
2. Diffs or full updated viewport component(s) showing debug visualization toggles.
3. Diffs or full updated Inspector component(s) showing additional blueprint and behavior info.
4. Full contents of the new docs files (`BlueprintFormat.md`, `CreatingANewSpecies.md`, `BehaviorAuthoring.md`),
   or at least their first complete drafts.
5. Notes on how these tools and docs should be used in day-to-day workflow.
