// General limb generator stub.
//
// This module defines a generic limb generator capable of producing
// arms, legs or other cylindrical appendages. The full algorithm will
// mirror the reference LimbGenerator but support arbitrary chains and
// radii profiles. For now it returns an empty BufferGeometry.

import * as THREE from 'three';
import { AnatomyChain, LimbOptions, AnatomyGenerator } from '../core/types.js';
// Import helpers for sampling and radii interpolation
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
// Import the tube builder from the utils module. This helper handles
// creation of a skinned tube with blended weights across bones. It
// accepts an array of points, radii per point and options such as
// sides, caps and weld tolerance. See anatomy/utils.js for details.
import { buildSkinnedTubeGeometry } from '../utils.js';

export const generateLimbGeometry: AnatomyGenerator<LimbOptions> = ({ skeleton, chain, options }) => {
  // Determine the number of radial subdivisions (sides). In low‑poly mode
  // we reduce the number of sides and allow vertices to be welded.
  const sides = options?.lowPoly
    ? Math.max(3, options.lowPolySegments ?? 6)
    : Math.max(3, options?.sides ?? 8);

  // Sample the world positions of each bone in the chain. These points
  // form the centres of the rings to be extruded along the limb. If
  // options.rings is specified we insert additional interpolated
  // points between bones to create smoother limbs.
  const bonePoints = sampleChainPositions(chain, skeleton);
  const points: THREE.Vector3[] = [];
  if (options?.rings && options.rings > 1 && bonePoints.length > 1) {
    for (let i = 0; i < bonePoints.length - 1; i++) {
      const start = bonePoints[i];
      const end = bonePoints[i + 1];
      for (let j = 0; j < options.rings; j++) {
        const t = j / options.rings;
        const p = new THREE.Vector3().lerpVectors(start, end, t);
        points.push(p);
      }
    }
    // push the last end point
    points.push(bonePoints[bonePoints.length - 1]);
  } else {
    points.push(...bonePoints);
  }

  // Compute radii for each sample point. We support radii defined on
  // options.radii, chain.radii or fall back to a default value. The
  // interpolateRadii helper smooths radii across segments.
  const baseRadii = options?.radii ?? chain.radii ?? [];
  const tempChain: AnatomyChain = { name: chain.name, boneNames: [], radii: baseRadii };
  const radii = interpolateRadii(tempChain, points.length);

  // Compose a radius profile by combining the chain profile (if any)
  // with an optional radiusProfile passed in the options. The
  // buildSkinnedTubeGeometry helper accepts a callback which
  // transforms the base radius per point. Here we multiply both
  // profiles together.
  const radiusProfile = (t: number, _theta: number, base: number) => {
    const profileA = evaluateProfile(chain, t);
    const extraProfile = typeof (options as any)?.radiusProfile === 'function'
      ? (options as any).radiusProfile(t)
      : 1;
    return base * profileA * extraProfile;
  };

  // Build the geometry using the shared tube helper. Pass cap flags
  // through directly and include the bone names so that the helper can
  // assign blended skin weights along the chain. Low‑poly weld
  // tolerance is applied when provided.
  const geometry = buildSkinnedTubeGeometry({
    points,
    radii,
    sides,
    radiusProfile,
    capStart: options?.capStart ?? false,
    capEnd: options?.capEnd ?? false,
    boneNames: chain.boneNames,
    weldTolerance: options?.lowPoly ? options?.lowPolyWeldTolerance ?? 0 : 0,
  });

  return { geometry, meta: undefined };
};
