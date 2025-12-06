// Canonical Elephant definition sourced from ElephantV3.5.
// This replaces the earlier stub and is intended to be the authoritative
// skeleton for future blueprint generation within CreatureStudio.
//
// Notes for future work:
// - The mapping at the bottom aligns these bone names to the current
//   ElephantBlueprint skeleton so we can procedurally emit blueprint
//   skeleton entries or validate coverage.
// - Bones present here but absent in the blueprint (e.g., tusks, head tips)
//   map to null to highlight missing geometry in the current blueprint.
// - Sizes provide rough radii/extent hints for body-part generation.

export const ElephantDefinition = {
  name: "Elephant",
  variant: "CanonicalV3_5",
  bones: [
    // === Main Body Column (The Barrel) ===
    // spine_base = Hips. High up.
    { name: "spine_base", parent: "root", position: [0, 2.1, 0] },
    // spine_tail hangs off the base; helps anchor the tail root.
    { name: "spine_tail", parent: "spine_base", position: [0, -0.5, -0.35] },
    // spine_mid = Ribcage. Lower and forward.
    { name: "spine_mid", parent: "spine_base", position: [0, -0.1, 1.1] },
    // spine_neck = Shoulder hump.
    { name: "spine_neck", parent: "spine_mid", position: [0, 0.3, 1.1] },
    // spine_head stretches forward to give the neck visible length.
    { name: "spine_head", parent: "spine_neck", position: [0, 0.1, 0.6] },
    // Head anchored slightly forward from the neck tip.
    { name: "head", parent: "spine_head", position: [0, -0.15, 0.45] },
    // Forward skull tip split into segments for extra pitch control.
    { name: "head_tip_1", parent: "head", position: [0, -0.05, 0.05] },
    { name: "head_tip_2", parent: "head_tip_1", position: [0, 0, 0], rotation: [-0.1745329, 0, 0] }, // -10° down
    { name: "head_tip_3", parent: "head_tip_1", position: [0.3, 0, 0], rotation: [-0.1745329, 0, 0] },
    { name: "head_tip_4", parent: "head_tip_1", position: [-0.3, 0, 0], rotation: [-0.1745329, 0, 0] },

    // === Trunk (Chain) ===
    { name: "trunk_anchor", parent: "head_tip_2", position: [0, -0.07, 0.15] },
    { name: "trunk_root", parent: "trunk_anchor", position: [0, -0.05, 0.4] },
    { name: "trunk_base", parent: "trunk_root", position: [0, -0.35, 0.25] },
    { name: "trunk_mid1", parent: "trunk_base", position: [0, -0.5, 0.1] },
    { name: "trunk_mid2", parent: "trunk_mid1", position: [0, -0.5, 0.0] },
    { name: "trunk_tip", parent: "trunk_mid2", position: [0, -0.4, 0.0] },

    // === Tusks (Start -> Tip) ===
    { name: "tusk_left", parent: "head_tip_3", position: [0.0, 0, 0.25] },
    { name: "tusk_left_tip", parent: "tusk_left", position: [0.1, 0.3, 0.5] }, // Curve up

    { name: "tusk_right", parent: "head_tip_4", position: [0, 0, 0.25] },
    { name: "tusk_right_tip", parent: "tusk_right", position: [-0.1, 0.3, 0.5] },

    // === Ears (Start -> Tip) ===
    { name: "ear_left", parent: "head", position: [0.4, 0.1, -0.5] },
    { name: "ear_left_tip", parent: "ear_left", position: [0.6, -0.6, -0.4] }, // Flop down

    { name: "ear_right", parent: "head", position: [-0.4, 0.1, -0.5] },
    { name: "ear_right_tip", parent: "ear_right", position: [-0.6, -0.6, -0.4] },

    // === Tail ===
    { name: "tail_base", parent: "spine_tail", position: [0, 0.3, -0.3] },
    { name: "tail_mid", parent: "tail_base", position: [0, -0.6, -0.2] },
    { name: "tail_tip", parent: "tail_mid", position: [0, -0.6, 0.0] },

    // === Shoulders/Collarbones ===
    // Moved X from 0.5 -> 0.4 to bury them inside the body
    { name: "front_left_collarbone", parent: "spine_mid", position: [0.4, -0.3, 0.3] },
    { name: "front_right_collarbone", parent: "spine_mid", position: [-0.4, -0.3, 0.3] },

    // === Hips/Pelvis ===
    // Moved X from 0.5 -> 0.45
    { name: "back_left_pelvis", parent: "spine_base", position: [0.45, -0.2, 0.1] },
    { name: "back_right_pelvis", parent: "spine_base", position: [-0.45, -0.2, 0.1] },

    // === Front Legs (Thick Columns) ===
    { name: "front_left_upper", parent: "front_left_collarbone", position: [0, -0.8, 0] },
    { name: "front_left_lower", parent: "front_left_upper", position: [0, -0.8, 0.05] },
    { name: "front_left_foot", parent: "front_left_lower", position: [0, -0.4, 0.05] },

    { name: "front_right_upper", parent: "front_right_collarbone", position: [0, -0.8, 0] },
    { name: "front_right_lower", parent: "front_right_upper", position: [0, -0.8, 0.05] },
    { name: "front_right_foot", parent: "front_right_lower", position: [0, -0.4, 0.05] },

    // === Back Legs (Thick Columns) ===
    { name: "back_left_upper", parent: "back_left_pelvis", position: [0, -0.8, 0.05] },
    { name: "back_left_lower", parent: "back_left_upper", position: [0, -0.8, -0.1] },
    { name: "back_left_foot", parent: "back_left_lower", position: [0, -0.4, 0.1] },

    { name: "back_right_upper", parent: "back_right_pelvis", position: [0, -0.8, 0.05] },
    { name: "back_right_lower", parent: "back_right_upper", position: [0, -0.8, -0.1] },
    { name: "back_right_foot", parent: "back_right_lower", position: [0, -0.4, 0.1] },
  ],

  sizes: {
    // === MASSIVE BODY RADII ===
    // We increase these to simulate the width of hips/shoulders
    spine_base: [1.1, 1.1, 1.2], // Huge rump
    spine_mid: [1.25, 1.35, 1.3], // Huge barrel chest
    spine_neck: [0.01, 0.1, 0.2], // Thick neck base
    spine_head: [0.9, 0.95, 0.95], // Neck tip toward the head
    head: [0.85, 0.95, 0.9], // Large skull
    head_tip_1: [0.5, 0.55, 0.55],
    head_tip_2: [0.5, 0.55, 0.55],

    trunk_anchor: [0.2, 0.2, 0.2],
    trunk_root: [0.26, 0.26, 0.26],
    trunk_base: [0.24, 0.24, 0.24],
    trunk_mid1: [0.23, 0.23, 0.23],
    trunk_mid2: [0.22, 0.22, 0.22],
    trunk_tip: [0.2, 0.2, 0.2],

    tusk_left: [0.1, 0.1, 0.4],
    tusk_left_tip: [0.02, 0.02, 0.4],
    tusk_right: [0.1, 0.1, 0.4],
    tusk_right_tip: [0.02, 0.02, 0.4],

    ear_left: [0.7, 0.7, 0.1],
    ear_left_tip: [0.6, 0.6, 0.1],
    ear_right: [0.7, 0.7, 0.1],
    ear_right_tip: [0.6, 0.6, 0.1],

    spine_tail: [0.15, 0.15, 0.3],
    tail_base: [0.15, 0.15, 0.3],
    tail_mid: [0.08, 0.08, 0.3],
    tail_tip: [0.06, 0.06, 0.2],

    // Thicker Legs
    front_left_upper: [0.45, 0.45, 0.45],
    front_left_lower: [0.35, 0.35, 0.35],
    front_left_foot: [0.38, 0.25, 0.38],

    back_left_upper: [0.5, 0.5, 0.5],
    back_left_lower: [0.38, 0.38, 0.38],
    back_left_foot: [0.38, 0.25, 0.38],

    front_right_upper: [0.45, 0.45, 0.45],
    front_right_lower: [0.35, 0.35, 0.35],
    front_right_foot: [0.38, 0.25, 0.38],
    back_right_upper: [0.5, 0.5, 0.5],
    back_right_lower: [0.38, 0.38, 0.38],
    back_right_foot: [0.38, 0.25, 0.38],
  },
};

// Map definition bone names to the existing ElephantBlueprint skeleton names.
// If a bone is absent from the current blueprint, its value is null to signal
// potential work for future blueprint generation or mesh support.
export const ElephantBlueprintBoneMap = {
  spine_base: "spine_base",
  spine_tail: null,
  spine_mid: "spine_mid",
  spine_neck: "spine_neck",
  spine_head: "spine_head",
  head: "head",
  head_tip_1: null,
  head_tip_2: null,
  head_tip_3: null,
  head_tip_4: null,
  trunk_anchor: null,
  trunk_root: "trunk_root",
  trunk_base: "trunk_base",
  trunk_mid1: "trunk_mid1",
  trunk_mid2: "trunk_mid2",
  trunk_tip: "trunk_tip",
  tusk_left: null,
  tusk_left_tip: null,
  tusk_right: null,
  tusk_right_tip: null,
  ear_left: "ear_left",
  ear_left_tip: "ear_left_tip",
  ear_right: "ear_right",
  ear_right_tip: "ear_right_tip",
  tail_base: "tail_base",
  tail_mid: "tail_mid",
  tail_tip: "tail_tip",
  front_left_collarbone: "front_leg_l_shoulder",
  front_right_collarbone: "front_leg_r_shoulder",
  back_left_pelvis: "back_leg_l_hip",
  back_right_pelvis: "back_leg_r_hip",
  front_left_upper: "front_leg_l_knee",
  front_left_lower: "front_leg_l_ankle",
  front_left_foot: "front_leg_l_foot",
  front_right_upper: "front_leg_r_knee",
  front_right_lower: "front_leg_r_ankle",
  front_right_foot: "front_leg_r_foot",
  back_left_upper: "back_leg_l_knee",
  back_left_lower: "back_leg_l_ankle",
  back_left_foot: "back_leg_l_foot",
  back_right_upper: "back_leg_r_knee",
  back_right_lower: "back_leg_r_ankle",
  back_right_foot: "back_leg_r_foot",
};

/**
 * Future helper: returns an array of mapping tuples so downstream code can
 * iterate the canonical definition and emit/patch blueprint skeleton entries.
 */
export function getElephantBlueprintBoneMapping() {
  return Object.entries(ElephantBlueprintBoneMap).map(([definitionBone, blueprintBone]) => ({
    definitionBone,
    blueprintBone,
  }));
}

export default ElephantDefinition;
