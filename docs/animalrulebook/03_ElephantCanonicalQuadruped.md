# Chapter 3 – The Elephant as Canonical Quadruped

The elephant is the **reference implementation** of a quadruped in Zoo. Other quadrupeds usually follow the same structure and patterns, with different proportions.

## 3.1 Data structure: ElephantDefinition

`ElephantDefinition.js` exports an object like this:

```js
export const ElephantDefinition = {
  bones: [
    { name: 'spine_base', parent: 'root', position: [0, 1.8, 0] },
    { name: 'spine_mid', parent: 'spine_base', position: [0, 0.0, 1.0] },
    { name: 'spine_neck', parent: 'spine_mid', position: [0, 0.1, 0.8] },
    { name: 'spine_head', parent: 'spine_neck', position: [0, 0.1, 0.6] },
    { name: 'head', parent: 'spine_head', position: [0, 0.0, 0.5] },
    // additional face, trunk, tail, and limb bones
  ],
  sizes: {
    spine_base: [1.1, 1.1, 1.2],
    spine_mid: [1.4, 1.4, 1.6],
    spine_neck: [0.8, 0.8, 1.0],
    spine_head: [0.6, 0.6, 0.8],
    head: [0.5, 0.5, 0.65]
    // more entries per limb and tail bone
  }
};
```

The specific values for positions and sizes may differ, but this outlines the main structure:

- A spine chain from hips to head.
- Limb chains for each leg.
- Additional chains for trunk, tail, and ears.

## 3.2 Chains used by the generators

The elephant’s generator references specific chains of bones:

- Spine: `['spine_base', 'spine_mid', 'spine_neck', 'spine_head']`
- Neck: `['spine_neck', 'head']`
- Head: `['head']`
- Trunk: `['trunk_root', 'trunk_base', 'trunk_mid1', 'trunk_mid2', 'trunk_tip']`
- Tail: `['tail_base', 'tail_mid', 'tail_tip']`
- Ears: `['ear_left', 'ear_left_tip']` and `['ear_right', 'ear_right_tip']`
- Front legs: each as a chain of four bones from shoulder to foot.
- Back legs: same pattern as front legs, from pelvis to foot.

These chains are passed into the body part generators and define the control skeleton for each part of the mesh.

## 3.3 ElephantCreature: building the rig and mesh

The `ElephantCreature` class:

1. Builds the bones from `ElephantDefinition.bones` into actual `THREE.Bone` instances.
2. Creates a `THREE.Skeleton` from those bones.
3. Instantiates `ElephantGenerator` and calls a build method with the skeleton and options.
4. Receives:
   - The final `SkinnedMesh` with elephant geometry and skin material.
   - A behavior object that can animate the bones.
5. Attaches the mesh and optional `SkeletonHelper` to its `THREE.Group` parent.

The creature does not itself know how to generate geometry, only how to invoke the generator and update behavior.

## 3.4 ElephantGenerator: using body parts

`ElephantGenerator` is the main “cookbook” example:

- It imports the torso, neck, head, tail, nose, limb, and fur generators.
- It defines per-body-part options such as `sides`, `radii` arrays, and special parameters.
- It uses `ElephantTorsoProfile` to shape the torso cross-section.
- It merges all the geometries into a single `BufferGeometry` and binds it as a `SkinnedMesh`.

In later chapters, we will follow the same patterns for other body plans.
