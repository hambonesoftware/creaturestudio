# Chapter 12 – Species Blueprints, Import, Export, and Editing

This chapter introduces **Species Blueprints**: data files that describe animals in a way that Zoo can import, edit, and export.

The goal is to separate:

- Authoring of animal data (skeleton, radii, materials, behavior presets).
- Code that interprets this data into actual Zoo source files.

## 12.1 Blueprint format

A Species Blueprint is a JSON document. A canonical filename could be:

- `AnimalBlueprint.json`
- Or `MyAnimalBlueprint.json` for a specific species.

Example structure:

```json
{
  "version": "1.0",
  "name": "Elephant",
  "bodyPlan": "quadruped",
  "scale": 1.0,

  "skeleton": {
    "bones": [
      {
        "name": "spine_base",
        "parent": "root",
        "position": [0, 1.8, 0]
      },
      {
        "name": "spine_mid",
        "parent": "spine_base",
        "position": [0, 0.0, 1.0]
      }
    ],
    "sizes": {
      "spine_base": [1.1, 1.1, 1.2],
      "spine_mid": [1.4, 1.4, 1.6]
    }
  },

  "torso": {
    "spineBones": ["spine_base", "spine_mid", "spine_neck", "spine_head"],
    "radii": [1.2, 1.4, 1.3, 0.9],
    "sides": 24,
    "lowPolySides": 10,
    "profileType": "elephant",
    "extendRumpToRearLegs": true
  },

  "limbs": [
    {
      "id": "front_left_leg",
      "type": "leg",
      "bones": [
        "front_left_collarbone",
        "front_left_upper",
        "front_left_lower",
        "front_left_foot"
      ],
      "radii": [0.7, 0.6, 0.45, 0.4, 0.35],
      "sides": 20
    }
  ],

  "tail": {
    "bones": ["tail_base", "tail_mid", "tail_tip"],
    "baseRadius": 0.4,
    "tipRadius": 0.15,
    "sides": 14
  },

  "nose": {
    "bones": [
      "trunk_root",
      "trunk_base",
      "trunk_mid1",
      "trunk_mid2",
      "trunk_tip"
    ],
    "baseRadius": 0.5,
    "tipRadius": 0.2,
    "sides": 16
  },

  "materials": {
    "skin": {
      "type": "elephantSkin",
      "baseColor": "#90857b",
      "roughness": 0.9
    },
    "fur": null
  },

  "behaviorPresets": {
    "gait": "heavy_quadruped",
    "idle": "breathing_tail_sway",
    "hasTrunkInteractions": true
  }
}
```

The goal is not to mirror every implementation detail, but to capture enough information that Zoo can:

- Build the skeleton.
- Call body part generators with the correct parameters.
- Pick a skin material.
- Choose a default behavior configuration.

## 12.2 Import workflow

When importing a blueprint into the creature studio:

1. The application reads the JSON and validates the schema.
2. It constructs a temporary `SpeciesBlueprint` object in memory.
3. It builds an in-memory skeleton and `SkinnedMesh` using generic logic:
   - A generic generator can be written that reads `torso`, `limbs`, `tail`, and `nose` sections.
4. The animal is displayed in the real-time viewer.

At this point the user can adjust values in the studio UI:

- Spine radii.
- Limb radii.
- Segment counts and profile types.
- Material color and roughness.
- Variant seed and scale.

Those adjustments update the blueprint object and trigger mesh regeneration.

## 12.3 Editing

The creature studio should expose blueprint properties in a structured way:

- Bone editor panel:
  - Lists bones from `skeleton.bones`.
  - Allows small position adjustments and parent changes.
- Torso panel:
  - Controls spine bones list, radii array, and sides.
  - Allows selection of `profileType`.
- Limbs panel:
  - Lists limb entries.
  - Lets the user change which bones are in a limb, radii, and sides.
- Tail and nose panel:
  - Controls bones and radii for tail, trunk, or snout.
- Materials panel:
  - Controls base skin color, roughness, and texture parameters.
- Behavior panel (optional):
  - Selects gait style and idle presets.

All modifications are applied to the blueprint object and can be exported.

## 12.4 Export to Zoo source

From a blueprint, Zoo can generate source files for a fully integrated animal.

Export steps:

1. Generate `MyAnimalDefinition.js` from `blueprint.skeleton`:
   - Convert the bones list and sizes map into the expected JS object.
2. Generate `MyAnimalGenerator.js` from `blueprint.torso`, `blueprint.limbs`, `blueprint.tail`, and `blueprint.nose`:
   - Emit code that calls `generateTorsoGeometry`, `generateLimbGeometry`, `generateTailGeometry`, and `generateNoseGeometry` using the configured parameters.
3. Generate stub behavior and locomotion files:
   - `MyAnimalBehavior.js`
   - `MyAnimalLocomotion.js`
   - These can include simple idle implementations and references to gait names from `behaviorPresets`.
4. Optionally generate a pen file:
   - `MyAnimalPen.js` with a basic ground plane and lighting.

Export destination:

- A new folder under `src/animals/MyAnimal` that mirrors the elephant’s layout.
- Or a zip file that you can unpack into your source tree.

## 12.5 Exporting back to blueprint

Animals that were originally written in code can be exported **back** into blueprint form:

- Write an exporter that reads `MyAnimalDefinition` and `MyAnimalGenerator` instances.
- Extract skeleton and radii parameters.
- Produce a JSON blueprint that matches this chapter’s structure.

This enables a round-trip workflow:

1. Hand-author a new animal in JS to explore possibilities.
2. Export a blueprint.
3. Use the studio UI to tweak proportions, colors, and behavior presets.
4. Export updated Zoo source or a new species package.
