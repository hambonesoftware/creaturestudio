# Chapter 9 – No-Ped Blueprint (Snakes, Eels, Snails, Slugs)

No-ped animals either have no distinct limbs (snakes, eels) or primarily move via a continuous underside foot (snails and slugs). This chapter explains how to use the torso generator for these.

## 9.1 Snake and eel skeletons

A simple snake skeleton is just a long spine with many segments:

```text
spine_0 -> spine_1 -> spine_2 -> ... -> spine_N -> head
```

Bones are defined in `MySnakeDefinition.bones` with small forward offsets. Radii in `sizes` can taper from a thick middle body to a thin tail.

## 9.2 Generating the body

Treat the entire spine as the torso chain:

```js
const spineBones = [
  'spine_0',
  'spine_1',
  'spine_2',
  // more entries
  'spine_N',
  'head'
];

const bodyRadii = [
  neckRadius,
  bodyRadius,
  bodyRadius,
  // tapering toward the tail
  tailRadius
];

const bodyGeometry = generateTorsoGeometry(skeleton, {
  bones: spineBones,
  radii: bodyRadii,
  sides: lowPoly ? bodySidesLowPoly : 18,
  radiusProfile: makeSnakeRadiusProfile(scale),
  extendRumpToRearLegs: false
});
```

Optionally split a short neck and head from the front of the chain if you want a more distinct head volume.

## 9.3 Snake locomotion

Snake locomotion relies on lateral waves along the spine:

1. Maintain a time parameter `t`.
2. For each spine bone index `i`:
   - Compute an angle such as `angle = amplitude * Math.sin(frequency * t + i * segmentPhaseOffset)`.
   - Apply this as a rotation around the Y axis.
3. Optionally compute forward motion from the same wave to prevent foot-sliding.

The same principle applies to eels, possibly with vertical wave components as well.

## 9.4 Snail and slug body plans

For snails and slugs, define:

- A short spine representing the main body.
- Optional bones for the underside foot.
- Optional bones for a shell or mantle.

Generate the body using `generateTorsoGeometry` with a `radiusProfile` that:

- Expands above the spine to form the bulk and shell area.
- Stays flatter below the spine to represent the sliding foot.

The shell can be:

- A separate static mesh parented to a spine bone.
- Or a skinned mesh bound mostly to one central bone if subtle deformation is needed.

Locomotion is slower and can be modeled as small undulations along the body and foot with minimal rotation.
