# Chapter 8 – Winged Blueprint

Winged creatures combine either a quadruped or biped body with one or two wing chains. This chapter covers how to construct wings using the same generators as limbs and ears.

## 8.1 Wing bones

A minimal wing can be represented by three bones per side:

- `wing_left_base`, `wing_left_mid`, `wing_left_tip`
- `wing_right_base`, `wing_right_mid`, `wing_right_tip`

Attach the base bones to a spine bone, such as:

- `spine_neck` for wings placed high on the back.
- `spine_mid` for wings placed halfway down the torso.

You can extend this to more bones if you need more detailed control over wing shape.

## 8.2 Using LimbGenerator for wings

Because wings are elongated limbs with a large flattened span, `generateLimbGeometry` is a good starting point.

Example:

```js
const leftWingGeometry = generateLimbGeometry(skeleton, {
  bones: ['wing_left_base', 'wing_left_mid', 'wing_left_tip'],
  radii: [
    wingRootRadius,
    wingMidRadius,
    wingTipRadius,
    wingTipRadius * 0.5
  ],
  sides: lowPoly ? wingSidesLowPoly : 12
});

const rightWingGeometry = generateLimbGeometry(skeleton, {
  bones: ['wing_right_base', 'wing_right_mid', 'wing_right_tip'],
  radii: [
    wingRootRadius,
    wingMidRadius,
    wingTipRadius,
    wingTipRadius * 0.5
  ],
  sides: lowPoly ? wingSidesLowPoly : 12
});
```

## 8.3 Flattening wings

After generating wing geometry, apply a transformation matrix to flatten and orient the wings appropriately. This is similar to how elephant ear geometry is post-processed.

A helper function might:

1. Look up the root wing bone.
2. Find its world-space position to serve as a pivot.
3. Build a matrix that:
   - Translates geometry so the pivot is at the origin.
   - Applies a rotation to tilt the wing.
   - Applies a scale such as `[1.0, 0.1, 1.5]` to flatten and stretch.
   - Translates back to the pivot.

Apply this matrix via `geometry.applyMatrix4(matrix)`.

## 8.4 Wing locomotion

Even if the creature is not fully flying, you can animate wings for life-like motion:

- Small twitches and fold adjustments while idle.
- Larger folds and unfolds when changing state.
- Full flapping animation in flight mode.

Flight can be modeled with a cyclical flap animation that:

- Rotates the base bones up and down.
- Adjusts finger or tip bones for feather splay.
- Coordinates with body pitch and tail motion.
