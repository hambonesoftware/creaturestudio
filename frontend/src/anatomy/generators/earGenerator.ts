// Ear generator stub.
//
// Ears are thin limb‑like appendages that are often reshaped after
// generation (e.g. flattened and fanned out). This generator
// produces a cylindrical limb and returns a meta object containing
// a transformation matrix to apply the ear fan/flatten effect.

import * as THREE from 'three';
import { AnatomyChain, EarOptions, AnatomyGenerator } from '../core/types.js';

export const generateEarGeometry: AnatomyGenerator<EarOptions> = ({ skeleton, chain, options }) => {
  // TODO: reuse limb generation logic, then compute a transform
  // matrix based on options.fanAngle and options.flattenScale. This
  // matrix can be returned in meta to be applied by the runtime.
  const geometry = new THREE.BufferGeometry();
  const meta = {
    transform: new THREE.Matrix4(),
  };
  return { geometry, meta };
};
