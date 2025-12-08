// Ear generator stub.
//
// Ears are thin limb‑like appendages that are often reshaped after
// generation (e.g. flattened and fanned out). This generator
// produces a cylindrical limb and returns a meta object containing
// a transformation matrix to apply the ear fan/flatten effect.

import * as THREE from 'three';
import { AnatomyChain, EarOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
import { buildSkinnedTubeGeometry } from '../utils.js';

export const generateEarGeometry: AnatomyGenerator<EarOptions> = ({ skeleton, chain, options }) => {
  // Use the same tube construction as limbs. Ears are thin appendages
  // attached along a short chain. A fan spread and flattening can be
  // applied via the returned transform matrix.
  const points = sampleChainPositions(chain, skeleton);
  const sides = options?.lowPoly
    ? Math.max(3, options.lowPolySegments ?? 6)
    : Math.max(3, options?.sides ?? 6);
  const baseRadii = options?.radii ?? chain.radii ?? [];
  const tempChain: AnatomyChain = { name: chain.name, boneNames: [], radii: baseRadii };
  const radii = interpolateRadii(tempChain, points.length);
  const radiusProfile = (t: number, _theta: number, base: number) => {
    const profileA = evaluateProfile(chain, t);
    return base * profileA;
  };
  const geometry = buildSkinnedTubeGeometry({
    points,
    radii,
    sides,
    radiusProfile,
    capStart: options?.capStart ?? false,
    capEnd: options?.capEnd ?? true,
    boneNames: chain.boneNames,
    weldTolerance: options?.lowPoly ? options?.lowPolyWeldTolerance ?? 0 : 0,
  });
  // Compute transform matrix for ear orientation. The fanAngle rotates
  // the ear around the Y axis to fan it outward, and flattenScale
  // squashes the geometry along the Z axis to thin it out. These
  // transformations are applied after the geometry is generated.
  const fan = options?.fanAngle ?? 0;
  const flatten = options?.flattenScale ?? 1;
  const rotation = new THREE.Matrix4().makeRotationY(fan);
  const scale = new THREE.Matrix4().makeScale(1, 1, flatten);
  const transform = new THREE.Matrix4().multiplyMatrices(rotation, scale);
  const meta = { transform };
  return { geometry, meta };
};
