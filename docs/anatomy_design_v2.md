# Anatomy V2 Design

This document outlines the proposed architecture for the **generalised anatomy layer** in CreatureStudio V2.1.  It builds on the observations captured in `zoo_reference_anatomy_notes.md` and defines how creatures will be constructed via data‑driven body‑part generators.  The goal is to support quadrupeds, bipeds, winged creatures, and more using a common set of abstractions, all driven by species blueprints.

## Core concepts

- **AnatomyChain** – A named sequence of bones (identified by name) along with optional radii and a profile function.  Chains represent anatomical regions like the spine, a leg, a wing, a tail or a trunk.  Chains may request a rump extension via `extendTo` to insert a sample behind the first bone.
- **AnatomyGeneratorOptions** – Base options shared by all generators, such as the number of radial sides, low‑poly flags, weld tolerance and cap controls.
- **Specific option types** – `TorsoOptions`, `LimbOptions`, `WingOptions`, `TailOptions`, `HeadOptions`, `NoseOptions`, and `EarOptions` extend the base options with additional parameters (e.g. rump bulge depth, ring counts, span, membrane resolution, thickness profiles).
- **AnatomyGenerator** – A generic function type that accepts a `skeleton`, an `AnatomyChain` and an options object, returning a `BufferGeometry` and optional metadata.  Generators are implemented separately for each body part (torso, limb, wing, tail, head, nose, ear) under `frontend/src/anatomy/generators`.
- **Supporting core modules** – Helpers for building chains, sampling positions and radii, and assigning skin weights reside in `frontend/src/anatomy/core`.  These modules decouple data preparation from geometry generation.

## Module layout

```
frontend/src/anatomy/
  core/
    types.ts       # interface and type definitions (see above)
    chains.ts      # utilities to build chains and resolve bones
    sampling.ts    # radii interpolation and profile evaluation
    skinning.ts    # skin weight assignment helpers
  generators/
    torsoGenerator.ts  # builds a torso around a spine chain
    limbGenerator.ts   # builds arms/legs/ears from a limb chain
    wingGenerator.ts   # builds wing membranes between wing bones
    tailGenerator.ts   # builds tails/trunks from a chain
    headGenerator.ts   # builds heads/skulls at chain tips
    noseGenerator.ts   # wrapper around tail for trunks/tusks
    earGenerator.ts    # specialised limb with fan/flatten

docs/
  anatomy_design_v2.md     # this document
  zoo_reference_anatomy_notes.md  # reference analysis from Phase 1
```

## Driving the anatomy from blueprints

Blueprints will define creatures in terms of **chains** and **generator selections** rather than hard‑coded limbs.  For example, an Elephant blueprint might contain:

```json
{
  "species": "Elephant",
  "chains": [
    { "name": "spine", "boneNames": ["spine_base", "spine_mid", "spine_neck"], "radii": [1.15, 1.35, 1.0], "profile": "elephantTorsoProfile", "extendTo": { "bones": ["back_left_foot", "back_right_foot"], "extraMargin": 0.05 } },
    { "name": "neck", "boneNames": ["spine_neck", "spine_head"], "radii": [0.95, 0.38] },
    { "name": "head", "boneNames": ["head"], "options": { "radius": 0.9 } },
    { "name": "trunk", "boneNames": ["trunk_base", "trunk_mid1", "trunk_mid2", "trunk_tip"], "radii": [0.46, 0.07, 0.26], "options": { "lengthScale": 1.0 } },
    { "name": "frontLeftLeg", "boneNames": ["front_left_collarbone", "front_left_upper", "front_left_lower", "front_left_foot"], "radii": [0.5, 0.45, 0.4, 0.38, 0.43] },
    { "name": "frontRightLeg", ... },
    { "name": "backLeftLeg", ... },
    { "name": "backRightLeg", ... },
    { "name": "tail", "boneNames": ["tail_base", "tail_mid", "tail_tip"], "options": { "baseRadius": 0.15, "tipRadius": 0.05 } },
    { "name": "earLeft", "boneNames": ["ear_left", "ear_left_tip"], "options": { "fanAngle": 0.785, "flattenScale": 0.18 } },
    { "name": "earRight", ... }
  ],
  "generators": {
    "spine": { "type": "torsoGenerator", "options": { "rumpBulgeDepth": 0.4, "lowPoly": true, "lowPolySegments": 9 } },
    "neck": { "type": "limbGenerator" },
    "head": { "type": "headGenerator", "options": { "detail": 1 } },
    "trunk": { "type": "noseGenerator" },
    "frontLeftLeg": { "type": "limbGenerator", "options": { "rings": 5 } },
    "frontRightLeg": { "type": "limbGenerator" },
    "backLeftLeg": { "type": "limbGenerator" },
    "backRightLeg": { "type": "limbGenerator" },
    "tail": { "type": "tailGenerator" },
    "earLeft": { "type": "earGenerator" },
    "earRight": { "type": "earGenerator" }
  }
}
```

In the example above, each chain is identified by name and lists its bones and radii.  The `generators` map tells the runtime which generator to call for each chain and passes through any part‑specific options.  A similar blueprint for a winged creature would include one or more wing chains and select `wingGenerator` for those chains with appropriate `WingOptions` (e.g. span and membrane resolution).

## Integration into the runtime

At runtime, a `GeneralisedCreatureGenerator` (implemented in Phase 5) will:

1. Load the species blueprint and build `AnatomyChain` objects for each chain.
2. Use the `generators` map to dispatch each chain to the appropriate generator in `frontend/src/anatomy/generators`.
3. Collect the returned geometries, apply any attachment transforms (e.g. ear fans), and merge them into a single `THREE.SkinnedMesh`.
4. Bind the mesh to the skeleton and create a behaviour controller similar to the old `ElephantBehavior`.

## Elephant and winged creatures

The design above supports the Elephant with a torso, limbs, tail, trunk/nose and ears.  A winged creature would define chains such as `leftWing` and `rightWing` with bone names like [`wing_shoulder`, `wing_mid`, `wing_tip`], assign per‑bone radii (or a profile function for thickness), and select `wingGenerator` with options specifying span, membrane resolution and feather hints.  Additional body parts like fins or flippers can be added by creating new generators or reusing limb/wing generators with different profiles.

This flexible scheme ensures that new species can be added by editing JSON blueprints without writing new runtime code.  The generator implementations will be fleshed out in Phase 3.
