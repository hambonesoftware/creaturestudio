# Phase 6 – Tooling, Validation, and Authoring UX

## Purpose

Build supporting tools, validation, and documentation so that the new blueprint-driven pipeline is sustainable,
safe to extend, and pleasant to work with. This phase turns the underlying architecture into a productive
authoring environment.

## Objectives

1. **Blueprint validation and linting**
   - Ensure structural correctness of blueprints before they are used at runtime.
   - Provide meaningful error messages for missing chains, invalid generators, or out-of-range values.

2. **Developer-facing debug tools**
   - Make it easy to debug skeletons, chains, and body-part geometry.
   - Offer toggles to visualize bones, chain paths, and per-part geometries.

3. **Authoring documentation and UI hints**
   - Document how to create and modify blueprints.
   - Expose relevant information through the CreatureStudio Inspector panel.

## Implementation Steps

### 1. Blueprint validator

- Implement a validator module that can be run:
  - In the backend (Python) as a CLI tool or CI check.
  - Optionally in the frontend for quick feedback when loading blueprints in development.

- Validation rules:
  - All `bodyParts.*.chain` references exist in `chains`.
  - All `chains.*` entries reference valid bone names in `skeleton.bones`.
  - All `generator` fields refer to known generators (torso, limb, nose, tail, etc.).
  - Numeric fields are within reasonable ranges (e.g., radii > 0, sides >= 3).
  - Behavior IDs map to known entries in the behavior registry (or are clearly marked as custom).

- Add a `scripts/validate_blueprints.py` that:
  - Scans all blueprint JSON files.
  - Runs validation.
  - Prints a summary and exits non-zero on error for CI integration.

### 2. Debug and visualization tools

- **Bone visualizer:**
  - Add an in-viewport toggle that draws lines or simple shapes from each bone to its children.
- **Chain highlighter:**
  - Given a chain name (e.g., "spine", "front_left_leg"), draw it in a distinct color to confirm definitions.
- **Per-part isolation:**
  - A developer-only mode where you can render just one body part (e.g., torso only) to debug geometry.

- Add keybindings or UI checkboxes in the CreatureStudio viewport to toggle these debug layers.

### 3. Inspector and authoring UX

- Expand the right-hand Inspector panel in CreatureStudio to show:
  - Resolved body-part options (e.g., for the torso: sides, radii, rumpBulgeDepth).
  - Chain definitions and which bones they cover.
  - Behavior presets and the resolved behavior ID from the registry.

- Provide inline hints or links to documentation for each section.

### 4. Documentation

- Under a `docs/` or `animalrulebook/` folder, create:
  - `BlueprintFormat.md` – full schema explanation.
  - `CreatingANewSpecies.md` – step-by-step guide to building a new blueprint from a template.
  - `BehaviorAuthoring.md` – guide to defining new behavior presets and registering new controllers.

## Success Criteria

- Blueprint changes are validated automatically in CI and during development.
- Debug tools reduce time spent on hunting down mis-labeled bones, chains, or generators.
- The Inspector exposes enough information that you can understand how a creature is built without opening files.

## Risks

- **Too much debug clutter:** mitigated by hiding debug tools behind developer-only flags or hotkeys.
- **Documentation drift:** mitigated by updating docs whenever the schema changes, and by linking docs directly
  from the UI.

## Checklists

- [ ] Blueprint validator implemented and wired into a CLI/CI script.
- [ ] Bone and chain visualizers available in the viewport.
- [ ] Per-part geometry isolation mode implemented.
- [ ] Inspector shows resolved body-part and behavior information.
- [ ] Blueprint and behavior authoring docs written and stored in the repo.
