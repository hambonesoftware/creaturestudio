# Chapter 6 – Quadruped Blueprint

Quadrupeds are the closest relatives to the elephant. This chapter defines a reusable blueprint for creating four-legged animals.

## 6.1 Recommended bone naming

For compatibility with existing tooling and examples, use these patterns:

- Spine:
  - `spine_base` (hips)
  - `spine_mid` (ribcage)
  - `spine_neck` (shoulders)
  - `spine_head` (upper neck)
  - `head`
- Front legs:
  - `front_left_collarbone`, `front_left_upper`, `front_left_lower`, `front_left_foot`
  - `front_right_collarbone`, `front_right_upper`, `front_right_lower`, `front_right_foot`
- Back legs:
  - `back_left_pelvis`, `back_left_upper`, `back_left_lower`, `back_left_foot`
  - `back_right_pelvis`, `back_right_upper`, `back_right_lower`, `back_right_foot`
- Tail:
  - `tail_base`, `tail_mid`, `tail_tip`
- Ears:
  - `ear_left`, `ear_left_tip`
  - `ear_right`, `ear_right_tip`

Use these directly or adopt a very close variant.

## 6.2 Wiring torso, neck, head, and tail

Example torso wiring:

```js
const spineBones = ['spine_base', 'spine_mid', 'spine_neck', 'spine_head'];

const torsoRadii = [
  hipsRadius,   // near spine_base
  bellyRadius,  // near spine_mid
  chestRadius,  // near spine_neck
  neckBaseRadius
];

const torsoGeometry = generateTorsoGeometry(skeleton, {
  bones: spineBones,
  radii: torsoRadii,
  sides: lowPoly ? torsoSidesLowPoly : 24,
  radiusProfile: makeMyAnimalTorsoRadiusProfile(scale),
  extendRumpToRearLegs: {
    bones: [
      'back_left_foot',
      'back_right_foot',
      'back_left_lower',
      'back_right_lower',
      'back_left_upper',
      'back_right_upper'
    ],
    extraMargin: 0.05,
    boneRadii: {
      back_left_upper: 0.5 * legScale,
      back_right_upper: 0.5 * legScale
    }
  }
});
```

Neck and head:

```js
const neckGeometry = generateNeckGeometry(skeleton, {
  bones: ['spine_neck', 'head'],
  headBone: 'head',
  neckTipBone: 'head',
  sides: lowPoly ? neckSidesLowPoly : 18,
  capBase: true
});

const headGeometry = generateHeadGeometry(skeleton, {
  // optional head-scale parameters
});
```

Tail:

```js
const tailGeometry = generateTailGeometry(skeleton, {
  bones: ['tail_base', 'tail_mid', 'tail_tip'],
  sides: lowPoly ? tailSidesLowPoly : 14,
  baseRadius: tailBaseRadius,
  tipRadius: tailTipRadius
});
```

## 6.3 Legs and ears

Legs (front left as example):

```js
const legConfig = {
  sides: lowPoly ? legSidesLowPoly : 20
};

const frontLeftLeg = generateLimbGeometry(skeleton, {
  bones: [
    'front_left_collarbone',
    'front_left_upper',
    'front_left_lower',
    'front_left_foot'
  ],
  radii: [
    legShoulderRadius,
    legUpperRadius,
    legLowerRadius,
    legAnkleRadius,
    legHoofRadius
  ],
  sides: legConfig.sides
});
```

Repeat with similar calls for the other three legs, changing bone names.

Ears:

```js
const leftEar = generateLimbGeometry(skeleton, {
  bones: ['ear_left', 'ear_left_tip'],
  radii: [earBaseRadius, earTipRadius],
  sides: lowPoly ? earSidesLowPoly : 20
});

const rightEar = generateLimbGeometry(skeleton, {
  bones: ['ear_right', 'ear_right_tip'],
  radii: [earBaseRadius, earTipRadius],
  sides: lowPoly ? earSidesLowPoly : 20
});
```

You can post-process ear geometry with a transformation matrix to tilt and flatten them.

## 6.4 Gait considerations

Quadruped locomotion typically uses either:

- A lateral sequence walk (elephant-like).
- A diagonal trot (horse or dog output).

Structure the gait logic so that each leg’s phase is offset by a fixed amount around the cycle.

In code:

- Maintain a `phase` in `[0, 1)`.
- For each leg, compute an offset `legPhase = phase + phaseOffset`.
- Use `Math.sin` or another waveform to rotate the upper leg bone, lower leg bone, and foot.
