# Phase 2 – Blueprint Schema Upgrade (Encoding Geometry Parameters)

## Purpose

Expand the `SpeciesBlueprint` schema so that it can fully describe the geometry parameters currently hard-coded
in Zoo’s elephant pipeline. This ensures that the blueprint becomes the single source of truth for body plan,
skeleton, and geometry options.

## Objectives

1. **Encode all Elephant-specific geometry parameters in the blueprint**
   - Torso radius profile and rump bulge.
   - Leg radius stacks and segment counts.
   - Trunk and tusk thickness, taper, and segment counts.
   - Ear transforms and tail thickness.
   - Low-poly vs higher-detail options.

2. **Make the schema general and versioned**
   - Introduce or update a `meta.schemaVersion` field (e.g., `"4.1.0"`).
   - Keep per-part options generic and reusable across species.
   - Ensure there are reasonable defaults when an option is omitted.

3. **Keep backend and frontend schemas in sync**
   - Backend: Pydantic `SpeciesBlueprint` model.
   - Frontend: TypeScript interfaces matching the same structure.

## Schema Design

### High-level blueprint structure

Each blueprint is expected to contain:

- `meta` – name, version, tags.
- `skeleton` – bone definitions, parent-child relationships, default transforms.
- `chains` – named chains referencing sequence(s) of bones (spine, neck, trunk, legs, tail).
- `bodyParts` – which generators to use for each major body region, and with which options.
- `materials` – material definitions and assignments.
- `behaviorPresets` – locomotion and idle behavior metadata.

### Body part options (example)

```json
"bodyParts": {
  "torso": {
    "generator": "torso",
    "chain": "spine",
    "options": {
      "sides": 28,
      "radiusProfile": "elephant_heavy",
      "radii": [1.15, 1.35, 1.0],
      "rumpBulgeDepth": 0.4,
      "extendRumpToRearLegs": {
        "bones": [
          "back_left_foot",
          "back_right_foot",
          "back_left_lower",
          "back_right_lower",
          "back_left_upper",
          "back_right_upper"
        ],
        "extraMargin": 0.05,
        "boneRadii": {
          "back_left_upper": 0.5,
          "back_right_upper": 0.5,
          "back_left_lower": 0.42,
          "back_right_lower": 0.42,
          "back_left_foot": 0.44,
          "back_right_foot": 0.44
        }
      }
    }
  },
  "front_left_leg": {
    "generator": "limb",
    "chain": "front_left_leg",
    "options": {
      "sides": 12,
      "radii": [0.5, 0.45, 0.4, 0.38, 0.43]
    }
  }
  /* ... other limbs, trunk, tusks, tail, ears ... */
}
```

### Backend Pydantic model

- Define nested models:
  - `TorsoOptionsModel`, `LimbOptionsModel`, `NoseOptionsModel`, `TailOptionsModel`, etc.
  - A `BodyPartOptionsModel` that uses a `Union[...]` or a tagged union via a `kind` field.
- Ensure all options are JSON-serializable and documented.

### Frontend TypeScript interfaces

- Mirror backend models with interfaces:
  - `TorsoOptions`, `LimbOptions`, etc.
  - `BodyPartDefinition` with `generator: string`, `chain: string`, `options: unknown` (later refined with tags).

## Implementation Steps

1. **Blueprint schema extension**
   - Update the backend `SpeciesBlueprint` Pydantic model.
   - Add field docs and default values.
   - Run backend tests (or add them) to ensure new fields serialize/deserialize correctly.

2. **Elephant blueprint upgrade script**
   - Create `scripts/upgrade_elephant_blueprint.py`:
     - Load `ElephantBlueprint.json`.
     - Inject the ElephantGenerator defaults into `bodyParts.*.options`.
     - Update `meta.schemaVersion` and write back a new file
       (e.g., `ElephantBlueprint.4.1.0.json`).
   - Verify by diffing old vs new blueprint to see added fields.

3. **Frontend model sync**
   - Update TS types/interfaces in the frontend to match the backend schema.
   - Add a small validation function that runs on blueprint load to ensure structural correctness.

## Success Criteria

- `ElephantBlueprint.json` fully describes all geometry parameters required for the elephant body.
- Adding new species only requires editing blueprint JSON; no hard-coded generator constants are needed.
- Backend and frontend schemas are in sync and versioned.

## Risks

- **Schema bloat:** mitigated by carefully scoping options and only adding fields that are needed.
- **Breaking older blueprints:** mitigated by versioning and upgrade scripts.

## Checklists

- [ ] Backend `SpeciesBlueprint` model updated and documented.
- [ ] Frontend blueprint type definitions updated.
- [ ] Elephant blueprint upgraded with all required options.
- [ ] Validation/upgrade script implemented and tested.
