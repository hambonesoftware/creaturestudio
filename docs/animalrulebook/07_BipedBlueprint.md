# Chapter 7 – Biped Blueprint

This chapter describes how to construct bipedal animals: two primary legs, optional arms, and a torso.

## 7.1 Bone naming patterns

You can stick close to the quadruped naming scheme or choose more human-like names. Two valid approaches:

### Pattern A – Reuse quadruped naming for legs

- Spine: `spine_base`, `spine_mid`, `spine_neck`, `spine_head`, `head`
- Legs:
  - `back_left_pelvis`, `back_left_upper`, `back_left_lower`, `back_left_foot`
  - `back_right_pelvis`, `back_right_upper`, `back_right_lower`, `back_right_foot`

Here, “back legs” actually become the primary biped legs.

### Pattern B – Human-like naming

- Legs:
  - `leg_left_hip`, `leg_left_upper`, `leg_left_lower`, `leg_left_foot`
  - `leg_right_hip`, `leg_right_upper`, `leg_right_lower`, `leg_right_foot`
- Arms:
  - `arm_left_shoulder`, `arm_left_upper`, `arm_left_lower`, `arm_left_hand`
  - `arm_right_shoulder`, `arm_right_upper`, `arm_right_lower`, `arm_right_hand`

Either pattern works as long as your generator passes the correct names into the limb generator.

## 7.2 Torso configuration

Torso and neck are generated based on the spine chain, exactly as in the quadruped case. The difference is largely in proportions:

- Hips narrower relative to chest.
- Head higher relative to hips.

Use a torso profile tuned for bipeds, or reuse the quadruped profile and adjust `radii` values.

## 7.3 Legs and arms generation

Example for Pattern B human-style legs:

```js
const leftLeg = generateLimbGeometry(skeleton, {
  bones: ['leg_left_hip', 'leg_left_upper', 'leg_left_lower', 'leg_left_foot'],
  radii: [
    hipRadius,
    thighRadius,
    calfRadius,
    ankleRadius,
    footRadius
  ],
  sides: lowPoly ? legSidesLowPoly : 20
});

const rightLeg = generateLimbGeometry(skeleton, {
  bones: ['leg_right_hip', 'leg_right_upper', 'leg_right_lower', 'leg_right_foot'],
  radii: [
    hipRadius,
    thighRadius,
    calfRadius,
    ankleRadius,
    footRadius
  ],
  sides: lowPoly ? legSidesLowPoly : 20
});
```

Arms use the same generator with different radii and bone names.

## 7.4 Biped locomotion

Compared with quadrupeds, bipeds:

- Have a more pronounced vertical motion of the center of mass.
- May rely on arm swing for balance.

Typical implementation steps:

1. Define a walk cycle duration and maintain a `phase` from 0 to 1.
2. Define phase offsets for left and right legs.
3. Apply rotation to hip and knee bones based on sinusoidal functions of phase.
4. Optionally add:
   - Pelvis rotation around Y for more natural weight shifts.
   - Arm swing out of phase with leg motion.
5. Add cross-fades between idle and walking states in the behavior layer.
