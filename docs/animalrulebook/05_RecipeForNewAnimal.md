# Chapter 5 – Recipe for Building a New Animal

This chapter presents a general procedure that you follow for **any** animal, regardless of body plan.

## 5.1 Step 1 – Choose a body plan

Decide which category your new animal belongs to:

- Quadruped (4 primary legs).
- Biped (2 primary legs, optional arms).
- Winged (biped or quadruped with one or two wings).
- No-ped (continuous body or sliding foot).

This will determine which chains and body parts you need.

## 5.2 Step 2 – Sketch the skeleton

Before writing code, draw a simple side and front view of the animal:

- Mark the hips, chest, neck base, head center.
- Mark each leg: upper, lower, and foot segments.
- Mark tail, ears, trunk, wings, or other features.

Decide **bone names** for each point and write them down.

## 5.3 Step 3 – Implement MyAnimalDefinition.js

Create a new file `MyAnimalDefinition.js` like this:

```js
export const MyAnimalDefinition = {
  bones: [
    { name: 'spine_base', parent: 'root', position: [0, 1.5, 0] },
    { name: 'spine_mid', parent: 'spine_base', position: [0, 0.0, 0.8] },
    { name: 'spine_neck', parent: 'spine_mid', position: [0, 0.1, 0.7] },
    { name: 'spine_head', parent: 'spine_neck', position: [0, 0.1, 0.5] },
    { name: 'head', parent: 'spine_head', position: [0, 0.0, 0.4] },
    // limbs, tail, ears, wings as needed
  ],
  sizes: {
    spine_base: [0.6, 0.6, 0.7],
    spine_mid: [0.8, 0.8, 0.9],
    spine_neck: [0.4, 0.4, 0.5],
    spine_head: [0.35, 0.35, 0.45],
    head: [0.3, 0.3, 0.35]
    // more radii hints for other bones
  }
};
```

Positions do not need to be perfect; they are the starting point for your geometry.

## 5.4 Step 4 – Implement MyAnimalCreature.js

Copy the structure of `ElephantCreature` and adapt it to your new definition:

- Import `MyAnimalDefinition` and `MyAnimalGenerator`.
- Build bones and a `THREE.Skeleton` from the definition.
- Ask the generator for `{ mesh, behavior }`.
- Add the mesh and optionally a skeleton helper to the group.
- Implement `update(delta)` that forwards to `behavior.update(delta)` and updates the helper.

This file should contain no geometry logic, only wiring.

## 5.5 Step 5 – Implement a torso profile (optional but recommended)

Create `MyAnimalTorsoProfile.js`:

- Provide a base function that maps `s` in `[0, 1]` to a base radius.
- Optionally add attachment bumps for shoulders, hips, and belly.
- Export a function that returns a `radiusProfile(s, theta, baseRadius)` compatible with `TorsoGenerator`.

If you do not want to start with a custom profile, you can temporarily reuse the elephant’s profile.

## 5.6 Step 6 – Implement MyAnimalGenerator.js

Create `MyAnimalGenerator.js` that:

1. Imports the necessary body part generators and your torso profile.
2. Sets default options for low-poly mode, sides counts, and variant seeds.
3. For each body part, calls the appropriate generator with carefully chosen bone chains and radii arrays.
4. Merges all geometries into a single `BufferGeometry`.
5. Creates a `SkinnedMesh` with a skin material (you can reuse the elephant material at first).
6. Returns `{ mesh, behavior: new MyAnimalBehavior(skeleton, mesh) }`.

This is the file where most species-specific geometry parameters live.

## 5.7 Step 7 – Implement behavior and locomotion

Start simple:

- Write `MyAnimalBehavior.js` with a single `state = 'idle'` and a `time` accumulator.
- In `update(delta)`, apply small breathing motions to the spine and tail and gentle head shifts.
- Optionally split gait logic into `MyAnimalLocomotion.js`, especially for quadrupeds and bipeds.

You can extend the behavior later to include:

- Walking and running.
- Looking around.
- Interacting with the environment (drinking, sniffing, grazing).

## 5.8 Step 8 – Implement MyAnimalPen.js

Create a pen that:

- Spawns your animal at a starting point.
- Defines the ground mesh and obstacles.
- Creates lighting and shadows appropriate for the species.
- Forwards each frame’s `delta` to the creature’s update.

This is where you can create savanna enclosures, forests, cliffs, or aquatic edges for different animals.
