# Chapter 4 – The Body Parts Library

This chapter explains the intended usage of each generator in the `bodyParts` folder. These generators are designed to be reusable across many animals and body plans.

## 4.1 TorsoGenerator (generateTorsoGeometry)

**File:** `bodyParts/TorsoGenerator.js`

Conceptual signature:

```js
export function generateTorsoGeometry(skeleton, options = {}) {
  // returns BufferGeometry with skinning attributes
}
```

Important options:

- `bones`: ordered list of spine bone names, from hips to head.
- `radii`: array of radii values sampled along the spine.
- `sides`: radial resolution of each ring.
- `lowPoly`: boolean to enable lower resolution mode.
- `lowPolySegments`: segment count when lowPoly is true.
- `lowPolyWeldTolerance`: distance threshold for vertex welding in low-poly mode.
- `radiusProfile(s, theta, baseRadius)`: callback that warps each ring’s shape.
- `capStart` and `capEnd`: booleans that control end caps.
- `extendRumpToRearLegs`: boolean or configuration object to ensure the rump covers rear leg attachments.

Generically, the torso generator:

1. Samples the world space position of each spine bone.
2. Interpolates an internal centerline through these points.
3. For each sample along this centerline:
   - Computes a ring of vertices around it based on `sides` and `radii`.
   - Applies `radiusProfile` to deform the ring.
4. Supports optional end caps and rump extension.

## 4.2 NeckGenerator (generateNeckGeometry)

**File:** `bodyParts/NeckGenerator.js`

Signature:

```js
export function generateNeckGeometry(skeleton, options = {}) {
  // returns BufferGeometry
}
```

Important options:

- `bones`: chain of neck bones from torso to head.
- `headBone`: name of the head bone used to align and skin the upper part.
- `neckTipBone`: final neck bone in the chain.
- `sides`: radial resolution.
- `yOffset`: vertical offset if the neck should sit above the line between bones.
- `capBase`: whether to add a cap where neck meets torso.

The neck generator essentially builds a shorter, smoother tube between torso and head.

## 4.3 HeadGenerator (generateHeadGeometry)

**File:** `bodyParts/HeadGenerator.js`

Signature:

```js
export function generateHeadGeometry(skeleton, options = {}) {
  // returns BufferGeometry
}
```

Behavior:

- Locates the head and neck bones.
- Builds a deformed ellipsoid referencing those points.
- Skins almost entirely to the head bone, with minimal blending if necessary.

Options can include things like `headScale` for species-specific proportions.

## 4.4 TailGenerator (generateTailGeometry)

**File:** `bodyParts/TailGenerator.js`

Signature:

```js
export function generateTailGeometry(skeleton, options = {}) {
  // returns BufferGeometry
}
```

Important options:

- `bones`: the tail bone chain from base to tip.
- `rootBone`: an optional reference bone near the hips or spine.
- `radii`: explicit per-segment radii.
- `baseRadius` and `tipRadius`: fallback radii if `radii` is not supplied.
- `sides`: radial resolution.

The tail generator uses a frame construction that avoids twisting along curved paths. This frame logic is reused in any long flexible appendage such as trunks or serpentine bodies.

## 4.5 NoseGenerator (generateNoseGeometry)

**File:** `bodyParts/NoseGenerator.js`

Signature:

```js
export function generateNoseGeometry(skeleton, options = {}) {
  // returns BufferGeometry
}
```

Behavior:

- Determines a starting root bone for the nose or trunk.
- Delegates most of the geometry logic to the tail-style generation.
- Can be used for:
  - Elephant trunks.
  - Long snouts.
  - Beaks and similar features with tapering.

Options are similar to tail but focused on the nose chain.

## 4.6 LimbGenerator (generateLimbGeometry)

**File:** `bodyParts/LimbGenerator.js`

Signature pattern:

```js
export function generateLimbGeometry(skeleton, options = {}) {
  // returns BufferGeometry
}
```

Important options:

- `bones`: chain of bones from root to end (upper, lower, foot).
- `radii`: one more radius than bones in the chain, to express joint transitions.
- `sides`: radial resolution.

The limb generator is used for:

- Legs (front and back).
- Arms (in bipeds).
- Ears (treated as flattened limbs).
- Wings (with post-flattening transforms in the generator).

It creates segments between each consecutive pair of bones, and assigns skin weights primarily to the two bones that define each segment.

## 4.7 FurGenerator (generateFurMesh)

**File:** `bodyParts/FurGenerator.js`

Signature:

```js
export function generateFurMesh(skinnedMesh, options = {}) {
  // returns Mesh representing fur strands
}
```

Options can include:

- `strandCount`
- `strandLength`
- `lengthJitter`
- `color`
- `thickness`

The fur generator samples the existing skinned mesh’s surface and attaches procedural cylinders or cards as fur strands. These strands are skinned so they respond to movement.

Fur is optional and can be added later in the pipeline.
