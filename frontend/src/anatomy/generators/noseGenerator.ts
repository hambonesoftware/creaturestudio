// Nose/trunk/tusk generator stub.
//
// This wrapper around the tail generator chooses an appropriate root
// bone and then delegates to generateTailGeometry. It exists as a
// separate generator to allow specialised options such as length
// scaling and fallback root bones.

import * as THREE from 'three';
import { AnatomyChain, NoseOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
import { buildSkinnedTubeGeometry } from '../utils.js';

export const generateNoseGeometry: AnatomyGenerator<NoseOptions> = ({ skeleton, chain, options }) => {
  // Resolve the root bone. If the provided rootBone exists in the
  // chain bone names, we leave the chain untouched; otherwise we do
  // nothing special. Support for fallbackRoots could be added here.
  // Sample the positions along the chain.
  let points = sampleChainPositions(chain, skeleton);
  // Apply length scaling: scale the offsets from the root to the tip.
  const lengthScale = options?.lengthScale ?? 1;
  if (lengthScale !== 1 && points.length > 1) {
    const root = points[0].clone();
    const tip = points[points.length - 1].clone();
    const baseVector = new THREE.Vector3().subVectors(tip, root);
    for (let i = 1; i < points.length; i++) {
      const offset = new THREE.Vector3().subVectors(points[i], root);
      const scaledOffset = offset.multiplyScalar(lengthScale);
      points[i] = root.clone().add(scaledOffset);
    }
    // extend tip further along the direction if lengthScale > 1
    if (lengthScale > 1) {
      points[points.length - 1] = root.clone().add(baseVector.multiplyScalar(lengthScale));
    }
  }
  // Determine radii: favour options.radii or fall back to chain radii
  // or simple tapering.
  let baseRadii: number[] = [];
  if (options?.radii && options.radii.length > 0) {
    baseRadii = [...options.radii];
  } else if (chain.radii && chain.radii.length > 0) {
    baseRadii = [...chain.radii];
  } else {
    const count = points.length;
    const base = options?.baseRadius ?? 0.2;
    const mid = options?.midRadius ?? base * 0.7;
    const tip = options?.tipRadius ?? base * 0.3;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const radius = t < 0.5
        ? base + (mid - base) * (t / 0.5)
        : mid + (tip - mid) * ((t - 0.5) / 0.5);
      baseRadii.push(radius);
    }
  }
  const tempChain: AnatomyChain = { name: chain.name, boneNames: [], radii: baseRadii };
  const radii = interpolateRadii(tempChain, points.length);
  const radiusProfile = (t: number, _theta: number, base: number) => {
    return base * evaluateProfile(chain, t);
  };
  const sides = options?.lowPoly
    ? Math.max(3, options.lowPolySegments ?? 6)
    : Math.max(3, options?.sides ?? 8);
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
  return { geometry, meta: undefined };
};
