// Helpers for constructing AnatomyChain objects from a skeleton and
// blueprint data. These functions do not generate geometry; they
// simply collect bone references and compute positions along a chain.
//
// In future phases, these helpers will sample bone transforms and
// precompute radii or length information. For now they provide
// lightweight utilities used by generator stubs.

import * as THREE from 'three';
import { AnatomyChain } from './types.js';

/**
 * Builds an AnatomyChain from a list of bone names. This helper does
 * not yet compute world positions or radii; it merely stores the
 * provided information in a structured way. Later phases will extend
 * this to derive positions and rest lengths from the skeleton.
 *
 * @param name Human‑friendly name for the chain
 * @param boneNames Names of bones, in order from root to tip
 * @param radii Optional radii array (may be one longer than bones)
 */
export function createChain(name: string, boneNames: string[], radii?: number[]): AnatomyChain {
  return {
    name,
    boneNames: [...boneNames],
    radii: radii ? [...radii] : undefined,
  };
}

/**
 * Retrieves an ordered array of bones corresponding to the given
 * AnatomyChain. Throws an error if any bone names are missing from
 * the skeleton. This can be used by generators to map from names to
 * `THREE.Bone` instances.
 */
export function resolveBones(chain: AnatomyChain, skeleton: THREE.Skeleton): THREE.Bone[] {
  return chain.boneNames.map((name) => {
    const bone = skeleton.bones.find((b) => b.name === name);
    if (!bone) {
      throw new Error(`Missing bone '${name}' in skeleton`);
    }
    return bone;
  });
}

/**
 * Samples world positions of each bone in the chain. At present this
 * simply reads `bone.matrixWorld` and extracts its position. In a
 * future phase we may add interpolation or extension points for
 * rump/wing membranes.
 */
export function sampleChainPositions(chain: AnatomyChain, skeleton: THREE.Skeleton): THREE.Vector3[] {
  return resolveBones(chain, skeleton).map((bone) => {
    bone.updateMatrixWorld(true);
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(bone.matrixWorld);
    return pos;
  });
}
