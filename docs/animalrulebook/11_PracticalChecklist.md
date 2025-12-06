# Chapter 11 – Practical Checklist

This chapter condenses the previous material into a checklist that you can follow for each new animal.

## 11.1 Choosing a starting point

- [ ] Decide if you are creating an animal **from scratch** or starting from an **imported blueprint**.
- [ ] Choose the **body plan**: quadruped, biped, winged, or no-ped.

## 11.2 Skeleton

- [ ] Sketch the animal’s spine, limbs, tail, wings, and head on paper.
- [ ] Name each bone, following conventions when possible.
- [ ] Implement `MyAnimalDefinition.bones` with parent relationships and positions.
- [ ] Provide approximate radii for each bone in `MyAnimalDefinition.sizes`.

## 11.3 Creature and torso profile

- [ ] Implement `MyAnimalCreature` by copying and adapting `ElephantCreature`.
- [ ] Implement `MyAnimalTorsoProfile` or reuse an existing profile temporarily.

## 11.4 Generator

- [ ] Implement `MyAnimalGenerator` that:
  - [ ] Calls `generateTorsoGeometry` for the torso.
  - [ ] Calls `generateNeckGeometry` for the neck.
  - [ ] Calls `generateHeadGeometry` for the head.
  - [ ] Calls `generateTailGeometry` for the tail if present.
  - [ ] Calls `generateNoseGeometry` for snouts or trunks if needed.
  - [ ] Calls `generateLimbGeometry` for legs, arms, wings, and ears.
  - [ ] Merges all geometries into a single `SkinnedMesh`.
  - [ ] Creates a suitable material (can reuse elephant skin at first).

## 11.5 Behavior and pen

- [ ] Implement a basic behavior class with idle animation.
- [ ] Optionally implement locomotion that drives gaits.
- [ ] Implement a pen environment with ground, lighting, and props.
- [ ] Instantiate the creature in the pen and wire `update(delta)`.

## 11.6 Variants and performance

- [ ] Decide whether the animal needs variants based on a seed.
- [ ] Decide whether you need low-poly and high-poly modes.
- [ ] Use the variant seed to adjust limb, head, and torso proportions.
- [ ] Use low-poly mode when many animals will be on-screen at once.
