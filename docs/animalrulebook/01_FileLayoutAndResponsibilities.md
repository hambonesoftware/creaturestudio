# Chapter 1 – File Layout and Responsibilities

This chapter explains the typical file layout for an animal and how each file participates in the system.

We use the elephant as a concrete example. You can mirror this structure for new animals.

## 1.1 Elephant file layout

A typical layout for the elephant in the repository looks like this (paths may vary slightly):

```text
src/
  animals/
    Elephant/
      ElephantDefinition.js
      ElephantGenerator.js
      ElephantCreature.js
      ElephantLocomotion.js
      ElephantBehavior.js
      ElephantTorsoProfile.js
      ElephantSkinNode.js
      ElephantSkinTexture.js
      ElephantPen.js
```

The shared body part generators live here:

```text
src/
  animals/
    bodyParts/
      TorsoGenerator.js
      NeckGenerator.js
      HeadGenerator.js
      TailGenerator.js
      NoseGenerator.js
      LimbGenerator.js
      FurGenerator.js
      FurStrand.js
```

## 1.2 Responsibilities per file

**ElephantDefinition.js**  

- Exports a data object that defines:
  - `bones`: array of `{ name, parent, position }` entries.
  - `sizes`: map of `boneName -> [radiusX, radiusY, radiusZ]`.
- No Three.js code here, just configuration.

**ElephantGenerator.js**  

- Imports `ElephantDefinition`, `TorsoGenerator`, `LimbGenerator`, and others.
- Builds all procedural geometry based on the skeleton:
  - Torso from spine bones.
  - Neck and head from neck and head bones.
  - Trunk from a nose chain.
  - Tail from a tail chain.
  - Limbs from limb chains.
  - Ears from limb-like chains.
- Merges all geometries into a single `SkinnedMesh` with a material.
- Returns `{ mesh, behavior }` to the caller.

**ElephantCreature.js**  

- High-level wrapper that:
  - Builds the bones (and `THREE.Skeleton`) from `ElephantDefinition`.
  - Calls `ElephantGenerator` with that skeleton.
  - Creates a group containing the mesh and optional debug helpers.
  - Exposes `update(delta)` that forwards to the behavior.

**ElephantLocomotion.js**  

- Encapsulates gait logic (phases of leg motion, idle vs walk, etc.).
- Does not deal with materials or geometry.
- Only modifies bones over time.

**ElephantBehavior.js**  

- Describes higher-level state and orchestration:
  - Idle, walking, drinking, looking around, trunk interactions.
- Owns an instance of `ElephantLocomotion`.
- May use the environment (pen) to decide behavior, such as moving toward a pond.

**ElephantTorsoProfile.js**  

- Defines functions that shape the torso cross-section over the spine parameter `s` and angle `theta`.
- Contains logic for attachment bulges (shoulders, hips, belly) in a data-driven way.

**ElephantSkinNode.js / ElephantSkinTexture.js**  

- Construct a node-based material for the elephant skin.
- Provide base color, roughness, and small-scale detail.

**ElephantPen.js**  

- Defines the space the elephant lives in:
  - Ground plane, rocks, slight elevation changes.
  - Water feature (pond), sky lighting, shadows.
- Instantiates an `ElephantCreature` and updates it each frame.

## 1.3 Recommended layout for new animals

For each new animal `MyAnimal`, mirror the elephant:

```text
src/animals/MyAnimal/
  MyAnimalDefinition.js
  MyAnimalGenerator.js
  MyAnimalCreature.js
  MyAnimalLocomotion.js
  MyAnimalBehavior.js
  MyAnimalTorsoProfile.js
  MyAnimalSkinNode.js
  MyAnimalSkinTexture.js
  MyAnimalPen.js
```

You can start with a minimal version:

- `MyAnimalDefinition.js`
- `MyAnimalGenerator.js`
- `MyAnimalCreature.js`
- `MyAnimalPen.js`

and fill in behavior, locomotion, and custom materials later.
