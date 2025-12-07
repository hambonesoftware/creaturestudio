// Sampling utilities for anatomy generators.
//
// These functions provide generic algorithms for interpolating radii
// along a chain and for creating parametric profiles. They are
// intentionally simple at this stage; later phases will add more
// sophisticated sampling (e.g. parallel‑transport frames for tails,
// smoothing functions, etc.).

import { AnatomyChain } from './types.js';

/**
 * Interpolates a radii array along the length of a chain. If the
 * provided `radii` array matches the number of bones exactly, each
 * segment between bones inherits the same start and end radius. If
 * `radii` has one extra element, the final value is used at the tip.
 *
 * @param chain The chain whose radii are being sampled
 * @param segments Number of samples to produce
 */
export function interpolateRadii(chain: AnatomyChain, segments: number): number[] {
  const r = chain.radii ?? [];
  const nBones = chain.boneNames.length;
  if (r.length === 0) {
    // Default radius of 0.1 for all segments
    return new Array(segments).fill(0.1);
  }
  const radii: number[] = [];
  for (let i = 0; i < segments; i++) {
    const t = segments > 1 ? i / (segments - 1) : 0;
    // Determine which segment of the provided radii we are in
    const segIndex = Math.floor(t * (nBones - 1));
    const a = r[segIndex] ?? r[0];
    const b = r[segIndex + 1] ?? r[r.length - 1] ?? a;
    const localT = (t * (nBones - 1)) - segIndex;
    radii.push(a + (b - a) * localT);
  }
  return radii;
}

/**
 * Evaluates a profile function if one exists on the chain. When no
 * profile is provided, returns 1 for all positions.
 *
 * @param chain The chain containing an optional profile
 * @param t Normalised position along the chain (0..1)
 */
export function evaluateProfile(chain: AnatomyChain, t: number): number {
  if (typeof chain.profile === 'function') {
    return chain.profile(t);
  }
  return 1.0;
}
