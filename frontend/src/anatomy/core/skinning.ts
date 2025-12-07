// Skinning helper functions.
//
// These utilities assign skin indices and weights to generated
// vertices. The implementations here are placeholders; in Phase 3
// they will be expanded to match the weighting strategies seen in
// the zoo reference (e.g. blending between adjacent bones for limbs
// and one‑bone assignments for tails). Generators should use these
// helpers rather than hard‑coding skin attributes.

import * as THREE from 'three';

/**
 * Assigns a single bone index to each vertex with weight 1. This is
 * useful for tails/trunks where each ring is driven entirely by
 * a specific bone. Returns typed arrays ready to be set on a
 * BufferGeometry. The caller is responsible for ensuring the length
 * of the arrays matches the vertex count.
 */
export function assignSingleBoneSkin(boneIndex: number, vertexCount: number): {
  skinIndices: Uint16Array;
  skinWeights: Float32Array;
} {
  const skinIndices = new Uint16Array(vertexCount * 4);
  const skinWeights = new Float32Array(vertexCount * 4);
  for (let i = 0; i < vertexCount; i++) {
    skinIndices[i * 4] = boneIndex;
    skinWeights[i * 4] = 1.0;
  }
  return { skinIndices, skinWeights };
}

/**
 * Blends two bone indices across a set of vertices. The weights
 * array should contain a value in [0,1] per vertex; weight 0 assigns
 * the vertex entirely to boneA, weight 1 assigns it entirely to
 * boneB. This is suitable for limbs and necks.
 */
export function assignBlendSkin(
  boneA: number,
  boneB: number,
  weights: number[]
): {
  skinIndices: Uint16Array;
  skinWeights: Float32Array;
} {
  const count = weights.length;
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const w = weights[i];
    skinIndices[i * 4] = boneA;
    skinIndices[i * 4 + 1] = boneB;
    skinWeights[i * 4] = 1 - w;
    skinWeights[i * 4 + 1] = w;
  }
  return { skinIndices, skinWeights };
}
