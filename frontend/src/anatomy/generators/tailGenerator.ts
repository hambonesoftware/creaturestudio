// Tail/trunk generator stub.
//
// A tail is a tapered tube following a chain of bones. The nose and
// trunk generators will reuse this logic. This stub will be expanded
// in Phase 3 to implement parallel‑transport frames and radius
// interpolation similar to zoo_reference's TailGenerator.

import * as THREE from 'three';
import { AnatomyChain, TailOptions, AnatomyGenerator } from '../core/types.js';

export const generateTailGeometry: AnatomyGenerator<TailOptions> = ({ skeleton, chain, options }) => {
  // TODO: sample chain positions, compute a parallel‑transport frame,
  // generate rings using base/mid/tip radii or chain.radii, and
  // assign single‑bone skin indices using assignSingleBoneSkin.
  const geometry = new THREE.BufferGeometry();
  return { geometry, meta: undefined };
};
