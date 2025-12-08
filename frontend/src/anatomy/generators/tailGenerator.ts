// Tail/trunk generator stub.
//
// A tail is a tapered tube following a chain of bones. The nose and
// trunk generators will reuse this logic. This stub will be expanded
// in Phase 3 to implement parallel‑transport frames and radius
// interpolation similar to zoo_reference's TailGenerator.

import * as THREE from 'three';
import { AnatomyChain, TailOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
import { buildSkinnedTubeGeometry } from '../utils.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

export const generateTailGeometry: AnatomyGenerator<TailOptions> = ({ skeleton, chain, options }) => {
  // Sample the positions along the bone chain. For tails we do not
  // insert intermediate rings; each bone maps to one ring. A tip ring
  // may be added implicitly via radii array.
  const points = sampleChainPositions(chain, skeleton);
  // Determine radii: prefer options.radii; otherwise derive from
  // base/mid/tip or chain.radii. If no radii provided we use a
  // simple taper: baseRadius → midRadius → tipRadius. When a radii
  // array is provided it may be one longer than the number of bones.
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
    // create linear interpolation base→mid→tip across the chain
    baseRadii = [];
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const radius = t < 0.5
        ? base + (mid - base) * (t / 0.5)
        : mid + (tip - mid) * ((t - 0.5) / 0.5);
      baseRadii.push(radius);
    }
  }
  // Interpolate radii to match the number of points. Note: we pass a
  // synthetic chain with only radii; other fields are unused.
  const tempChain: AnatomyChain = { name: chain.name, boneNames: [], radii: baseRadii };
  const radii = interpolateRadii(tempChain, points.length);
  // Combine profile from chain (if any) with nothing else; tails do
  // not support extra radius profiles via options.
  const radiusProfile = (t: number, _theta: number, base: number) => {
    return base * evaluateProfile(chain, t);
  };
  // Determine sides; tails can use fewer sides for low‑poly mode.
  const sides = options?.lowPoly
    ? Math.max(3, options.lowPolySegments ?? 6)
    : Math.max(3, options?.sides ?? 8);
  // Build geometry. Provide the bone names so the helper assigns
  // blended weights. For a pure tail we prefer single‑bone weights,
  // however the helper's blending across bones is acceptable. If
  // strict single‑bone weights are required, they can be applied
  // externally using assignSingleBoneSkin.
  let geometry = buildSkinnedTubeGeometry({
    points,
    radii,
    sides,
    radiusProfile,
    capStart: options?.capStart ?? false,
    capEnd: options?.capEnd ?? true,
    boneNames: chain.boneNames,
    weldTolerance: options?.lowPoly ? options?.lowPolyWeldTolerance ?? 0 : 0,
  });
  // For tails/trunks it is common to weight each ring entirely to a
  // single bone. If requested (via a flag on options), override the
  // skinning computed by buildSkinnedTubeGeometry. When not
  // specified we leave the blended weights in place.
  if ((options as any)?.singleBoneWeight) {
    const vertexCount = geometry.getAttribute('position').count;
    // Use the first bone index for all vertices. This may be
    // incorrect if multiple bones are present; but the caller can
    // supply a different index via singleBoneWeight option in future.
    const { skinIndices, skinWeights } = assignSingleBoneSkin(0, vertexCount);
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  }
  return { geometry, meta: undefined };
};
