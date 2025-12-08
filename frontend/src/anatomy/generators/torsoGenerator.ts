// General torso generator stub.
//
// This module provides the signature for a torso generator that builds a
// tube around a spine chain. The implementation will be provided in
// Phase 3, based on the algorithms observed in zoo_reference.

import * as THREE from 'three';
import { AnatomyChain, TorsoOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
import { buildSkinnedTubeGeometry } from '../utils.js';

/**
 * Generates a torso geometry along a given chain of spine bones. The
 * returned BufferGeometry should have position, normal, uv and skin
 * attributes, but at this stage it is an empty placeholder. See
 * docs/anatomy_design_v2.md for intended usage.
 */
export const generateTorsoGeometry: AnatomyGenerator<TorsoOptions> = ({ skeleton, chain, options }) => {
  // Sample the spine points. At present we map one ring per bone; a
  // more sophisticated implementation could insert additional rings
  // between vertebrae to smooth the torso. We ignore rump extension
  // for simplicity.
  const points = sampleChainPositions(chain, skeleton);
  // Determine sides; reduce when low‑poly mode is enabled.
  const sides = options?.lowPoly
    ? Math.max(3, options.lowPolySegments ?? 8)
    : Math.max(3, options?.sides ?? 12);
  // Compute base radii. Prefer chain.radii; fall back to a default
  // constant radius. The number of radii may be one longer than
  // bones; interpolate accordingly.
  const baseRadii = chain.radii ?? [];
  const tempChain: AnatomyChain = { name: chain.name, boneNames: [], radii: baseRadii };
  const radii = interpolateRadii(tempChain, points.length);
  // Compose the radius profile combining chain profile and an
  // optional radiusProfile from options. This allows species‑specific
  // shapes such as wider hips or a tapered neck. The rumpBulgeDepth
  // option is ignored for now; more advanced algorithms would
  // inflate the initial rings accordingly.
  const radiusProfile = (t: number, _theta: number, base: number) => {
    const profileA = evaluateProfile(chain, t);
    const profileB = typeof options?.radiusProfile === 'function'
      ? (options as TorsoOptions).radiusProfile!(t)
      : 1;
    return base * profileA * profileB;
  };
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
