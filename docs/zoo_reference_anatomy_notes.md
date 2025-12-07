# Zoo Reference Anatomy Notes

These notes document how the **Zoo elephant** and its constituent body‑part generators are assembled in the `zoo_reference` folder.  They serve as a guide for designing a **generalised anatomy pipeline** in CreatureStudio V2.1.  Nothing in `zoo_reference` should be imported at runtime; it is strictly a reference implementation.

## File inventory

### `zoo_reference/Elephant`

| File | Role |
| --- | --- |
| **`ElephantDefinition.js`** | Defines the elephant’s skeleton: a list of bones with parent relationships and relative positions.  Also assigns per‑bone radius vectors used by the reference generators. |
| **`ElephantGenerator.js`** | Orchestrates geometry creation.  Samples bone positions, computes variant‑based scale factors, calls body‑part generators (torso, neck, head, trunk/tusk, ears, tail, legs) and merges the resulting geometries.  Applies low‑poly options, weld tolerances, rump extensions, and variant scaling.  Returns a `THREE.SkinnedMesh` plus an `ElephantBehavior`. |
| **`ElephantBehavior.js`** | High‑level animation controller.  Holds references to the skeleton and mesh, instantiates `ElephantLocomotion`, exposes state for the UI, and updates bones per frame. |
| **`ElephantLocomotion.js`** | Implements procedural animation for idle and walking states.  Uses bone names (e.g. legs, head, trunk) to compute rotations and positions over time. |
| **`ElephantPen.js`** | Defines the elephant’s environment (enclosure and pond) and spawns the creature with the appropriate behavior. |
| **`ElephantSkinNode.js`** | Builds a node‑based material for the elephant’s skin.  Exposes options for body colour and low‑poly shading. |
| **`ElephantSkinTexture.js`** | Generates a procedural texture used by the elephant skin shader. |
| **`ElephantTorsoProfile.js`** | Exports a function `makeElephantTorsoRadiusProfile(headScale)` that returns a radius profile function used to taper the torso from hips through the ribcage into the neck. |
| **`elephant_highpoly_lowpoly.obj`** | A reference high‑poly mesh for comparison; not used programmatically. |

### `zoo_reference/bodyParts`

| Module | Purpose & key inputs |
| --- | --- |
| **`TorsoGenerator.js`** | Builds a ring‑based tube around a chain of spine bones.  Accepts `bones`, `radii`, `sides` and various options (lowPoly flags, weld tolerance, start/end caps, `rumpBulgeDepth`, and `extendRumpToRearLegs` with bone names, extra margins and radii).  Computes a forward/backward vector from the first two bones to orient the rump extension, then constructs a series of rings.  Returns a `BufferGeometry` with `skinIndex`/`skinWeight` attributes. |
| **`NeckGenerator.js`** | Extrudes a short tube between neck bones (default `'spine_mid'` → `'spine_neck'`) and caps it.  Supports `radii`, `sides`, `capBase`, and optional custom head/neck tip bones.  Blends skin weights between adjacent bones for smooth deformation. |
| **`HeadGenerator.js`** | Creates an ellipsoidal head by scaling an icosahedron between the neck and head bones.  All vertices are weighted to the `head` bone.  Options: base `radius` and subdivision `detail`. |
| **`LimbGenerator.js`** | Extrudes a limb along a sequence of bones.  Takes `bones`, `radii` (optionally one more entry than bones for tapering), `sides` and `rings` (number of radial rings per bone segment).  Builds each segment by constructing a local coordinate frame (tangent, side, binormal) and interpolating between start/end positions and radii.  Skin weights are blended between adjacent bones along the limb. |
| **`TailGenerator.js`** | Builds a smooth tube (tail or trunk) anchored at a root bone and following an array of bones.  Supports `sides`, `baseRadius`, `midRadius`, `tipRadius`, `radii`, and `yOffset`.  Uses a **parallel–transport frame** to orient consecutive rings and avoid twisting.  Skinning assigns each ring entirely to a single bone (simple 1‑bone weights). |
| **`NoseGenerator.js`** | Thin wrapper around `TailGenerator` that chooses a default root bone from a set of fallbacks (`head_tip_2`, `head_tip_1`, `head`) if the preferred `rootBone` is absent.  Used for trunks and tusks. |
| **`FurGenerator.js`** | Generates fur strands for the low‑poly body.  Likely used in other animals but not central to the elephant. |
| **`FurStrand.js`** | Defines individual fur strand geometry and animation. |
| **`bodyPartsV3.2.zip`** | Archive of previous body‑part implementations for reference. |

## Elephant pipeline overview

The `ElephantGenerator` coordinates construction of the elephant mesh as follows:

1. **Skeleton sampling.**  Before sampling bone positions, it calls `bone.updateMatrixWorld(true)` on every bone to ensure world matrices are up to date.  The skeleton comes from `ElephantDefinition` and includes bones for the spine, limbs, trunk, tusks, ears, tail, and head.
2. **Global style flags.**  Options such as `lowPoly`, `lowPolyTorsoSegments`, `lowPolyTorsoWeldTolerance` and per‑part segment counts (`lowPolyHeadSides`, `lowPolyLegSides`, etc.) determine radial segment counts and whether to weld vertices for a faceted look.  A `variantSeed` controls subtle size variations (leg length, tusk length, head scale) via simple pseudo‑random ranges.
3. **Torso.**  Calls `generateTorsoGeometry` with a list of spine bones (`spine_base`, `spine_mid`, `spine_neck`), radii `[hips, ribcage, neck base]` and a custom radius profile from `makeElephantTorsoRadiusProfile`.  When `extendRumpToRearLegs` is enabled, an extra ring is inserted behind the hips to cover the rear legs.  A `rumpBulgeDepth` parameter pushes the rump outward.
4. **Neck.**  Uses `generateNeckGeometry` between `spine_neck` and `spine_head`, specifying radii and optional caps.  This creates a smooth transition from the torso to the head.
5. **Head.**  Uses `generateHeadGeometry` with a radius derived from the variant‑scaled head size.  The head is a squashed icosahedron oriented along the neck.
6. **Trunk and tusks.**  The trunk (prehensile nose) is generated via `generateNoseGeometry` over the bones `trunk_base` → `trunk_tip`.  Its base, mid and tip radii are clamped based on the distance between tusks and the head size to avoid intersecting the skull.  Two tusks are generated by calling `generateNoseGeometry` with different root bones (`head_tip_3`, `head_tip_4`) and shorter radii; a `lengthScale` modifies their curvature.
7. **Ears.**  Each ear is built using `generateLimbGeometry` over a two‑bone chain (`ear_left` → `ear_left_tip`), then transformed: the geometry is translated to the ear root, rotated around Z (±45°) to create a fan, flattened along Z to form a thin slice, and translated back.  Normals are recomputed after transformation.
8. **Tail.**  Calls `generateTailGeometry` along `spine_tail` → `tail_tip` with base/mid/tip radii.  The tail uses a parallel–transport frame so rings twist smoothly.
9. **Legs.**  Generates front and back legs using `generateLimbGeometry` on four‑bone chains (collarbone/pelvis → upper → lower → foot).  Radii arrays include an extra entry to flare the hoof.  The `legScale` factor modulates limb thickness and length based on the variant seed.
10. **Merging and skinning.**  All body‑part geometries are passed through `ensureSkinAttributes`, which ensures that each has position, normal, UV, `skinIndex` and `skinWeight` attributes and converts them to non‑indexed form.  They are then merged via `mergeGeometries`.  The resulting geometry is bound to the skeleton to form a `THREE.SkinnedMesh`.  A custom skin material from `ElephantSkinNode` is applied.  Finally, an `ElephantBehavior` is created to handle animation.

## Generator patterns and reusable concepts

The reference body‑part generators share several common patterns:

* **Ring‑based extrusion.**  Torso, neck, limb and tail modules all iterate along a sequence of sample points (usually bone positions) and construct rings of vertices at each point.  Consecutive rings are bridged into quads/triangles.  Radii arrays allow tapering along the chain.
* **Bone chains and radii profiles.**  A generator typically accepts an ordered list of bone names (`bones`) and a parallel list of radii.  When `radii` has one more entry than the number of bones, the last entry defines the radius at the final joint to allow flaring (e.g. hooves).
* **Segment density and low‑poly options.**  Each generator has a `sides` parameter controlling radial subdivision.  When `lowPoly` is true, the number of sides is reduced and vertices can be welded within a tolerance to produce faceted surfaces.
* **Skinning.**  Geometry is skinned by assigning each ring’s vertices to one or two bones.  For limbs and necks, weights blend between adjacent bones; for tails/trunks, each ring is assigned to a single bone to keep deformation simple.
* **Orientation frames.**  To avoid twisted geometry, the tail/trunk generator uses a parallel–transport frame (tangent, normal, binormal) computed from consecutive bone positions.  Limb and torso generators build local frames from global axes and direction vectors, switching up vectors when necessary.
* **Caps and end conditions.**  Generators often add triangular fans to cap open ends (`capStart`, `capEnd`).  NeckGenerator also builds a conical cap connecting the neck to the head using intermediate rings and apex vertices.
* **Extensions and bulges.**  TorsoGenerator’s `extendRumpToRearLegs` option inserts an additional ring behind the hips to cover the back legs, using the farthest rear leg positions plus an extra margin.  `rumpBulgeDepth` introduces an outward bulge at the rump.
* **Variant scaling.**  ElephantGenerator demonstrates how species‑specific generators can scale radii and lengths based on a variant seed.  This pattern can generalise to a wider set of species parameters.

## Preliminary anatomy vocabulary

The following abstraction ideas emerge from studying the zoo reference code.  These will form the basis of the general anatomy system in later phases:

| Concept | Description |
| --- | --- |
| **`AnatomyChain`** | A named sequence of bones with associated world‑space positions.  Used to sample the skeleton for extrusion.  May include a parallel list of radii and optional flags for capping or extending. |
| **`AnatomyGenerator`** | A function that takes an `AnatomyChain`, style options (e.g. number of sides, rings, caps, low‑poly flags) and returns a `BufferGeometry` with position, normal, UV and skinning attributes.  Examples: `torsoGenerator`, `limbGenerator`, `wingGenerator`, `tailGenerator`, `neckGenerator`, `headGenerator`. |
| **`AnatomyProfile`** | A reusable function that maps a normalised position along a chain (0 at root to 1 at tip) to a radius multiplier.  Profiles can model rumps, ribcages, wing membranes, or trunk tapering. |
| **`AnatomyStyle`** | Encapsulates visual style settings such as high‑poly vs low‑poly, segment counts, weld tolerances, cap behaviour and smoothing.  Species blueprints will reference styles to control the look of each body part. |
| **`AnatomyAttachment`** | A transformation applied after generation to attach or reshape a geometry relative to a bone (e.g. ear flaps rotated and flattened).  Attachments can include scaling, rotation, translation or bending. |
| **`GeneralisedCreatureGenerator`** | A high‑level orchestrator akin to `ElephantGenerator` that reads a species blueprint, instantiates the appropriate `AnatomyChain` objects, calls the needed generators and attachments, merges geometries and returns a skinned mesh along with behaviour controllers. |

### Mapping Elephant features to the vocabulary

* **Rump bulge** and **rump extension** correspond to a torso `AnatomyProfile` and an `extendRumpToRearLegs` flag in the `AnatomyChain` for the spine.  The profile modifies radii near the hips, while the extension inserts an extra sample beyond the first bone.
* **Leg flare** is modelled by supplying one more radius than there are leg bones in the limb chain, creating a distinct hoof ring.  This can be captured in an `AnatomyChain` definition or a leg‑specific profile.
* **Trunk taper** uses a tail generator with radii decreasing from base to tip; a dedicated trunk profile could generalise this for any prehensile nose.
* **Ear fan** uses an `AnatomyAttachment` that rotates and flattens a limb geometry about its root pivot.  Other creatures’ fins or wings might reuse this pattern.
* **Variant scaling** can be expressed by parameters in the blueprint (e.g. `legScale`, `tuskScale`, `headScale`) that modify radii or chain lengths before passing them to generators.

## Limitations and assumptions in the zoo reference

* Bone chains and profiles are **hard‑coded** for the elephant.  A more general system should infer chains from blueprint data and allow arbitrary numbers of bones per chain.
* Skinning strategies vary by generator (limbs blend between two bones, tails assign one bone per ring).  The general pipeline should allow the blueprint to choose the weighting scheme per chain.
* Some constants (e.g. 45° ear rotation, number of cap segments) are specific to the elephant and may need to be parametrised or adjusted for other species.
* `FurGenerator` and `FurStrand` are not directly used by the elephant generator but may influence future species (e.g. furry creatures).  These modules likely need integration hooks in later phases.

## Next steps (Phase 2 and beyond)

Based on these insights, Phase 2 will design TypeScript interfaces and module structures to represent `AnatomyChain`, `AnatomyGenerator`, `AnatomyProfile`, and related abstractions.  Subsequent phases will implement generalised generators, update species blueprints to use them, and integrate a new runtime pipeline into CreatureStudio.
