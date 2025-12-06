# Chapter 2 – Coordinate System and Rigging Conventions

Understanding the coordinate and rigging conventions is crucial for making the body part generators reusable.

## 2.1 World coordinate conventions

Zoo uses a standard Three.js style coordinate system with specific semantics:

- `+Y` is **up**.
- `+Z` is **forward** (direction the animal is facing).
- `+X` is **to the animal’s right**.
- The ground plane is approximately `y = 0` in world or pen space.

## 2.2 Scale

There is no hard requirement on real-world units, but it is helpful to treat:

- `1.0` world unit as approximately **one meter**.

The elephant uses a scale roughly in the 2 to 4 unit range for body dimensions. For consistency between species:

- Keep most body heights in the range `[1.0, 5.0]` units.
- Ensure that feet bones end near `y = 0` so the animal stands on the ground, not above or below it.

## 2.3 Skeleton conventions

### 2.3.1 Root and hips

The base of the skeleton is one of:

- A conceptual `"root"` bone that never moves.
- A hip bone such as `"spine_base"` attached to the root.

The hip bone typically sits **above the ground** (often `y ≈ 1.0` to `2.0`). Feet bones should be placed so that, in the bind pose, the feet sit near the ground.

### 2.3.2 Bone transforms

`ElephantDefinition.bones` describes each bone as a local offset relative to its parent:

```js
{
  name: 'spine_mid',
  parent: 'spine_base',
  position: [0.0, 0.0, 0.9]
}
```

During rig construction:

- A `THREE.Bone` is created for each entry.
- The bone’s **local position** is set to the given offset.
- Parent-child relationships are set by looking up the parent’s bone.

At runtime, body part generators read **world-space positions** from each bone using its `matrixWorld`.

### 2.3.3 Skinning

Skinned geometry follows these rules:

- Each vertex receives at most **two bone influences**, with weights that sum to `1.0`.
- Bones indices correspond to the order of bones within the `THREE.Skeleton`.
- Body part generators compute `skinIndex` and `skinWeight` attributes directly.

For example, a limb segment between `upper` and `lower` bones:

- Assigns vertices near the top mainly to `upper` with weight around `1.0`.
- Assigns vertices near the bottom mainly to `lower` with weight around `1.0`.
- Blends between them along the length of the segment.

## 2.4 Naming conventions

You are not forced to use the elephant’s names, but following similar patterns improves clarity and makes reuse easier.

Common patterns:

- `spine_base`, `spine_mid`, `spine_neck`, `spine_head`
- `head`, plus optional extras like `head_tip_1`, `head_tip_2`
- `front_left_upper`, `front_left_lower`, `front_left_foot`
- `back_right_pelvis`, `back_right_upper`, `back_right_lower`, `back_right_foot`
- `tail_base`, `tail_mid`, `tail_tip`
- `ear_left`, `ear_left_tip`

These names form intuitive chains that map directly into body part generator options.
