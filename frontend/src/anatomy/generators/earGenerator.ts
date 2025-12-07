// Ear generator
//
// Ears are thin limb‑like appendages that are often reshaped after
// generation (e.g. flattened and fanned out). This generator
// produces a cylindrical limb geometry and returns a meta object
// containing a transformation matrix to apply the ear fan/flatten
// effect.

import * as THREE from 'three';
import { AnatomyChain, EarOptions, AnatomyGenerator } from '../core/types.js';
import { generateLimbGeometry } from './limbGenerator.js';

export const generateEarGeometry: AnatomyGenerator<EarOptions> = ({ skeleton, chain, options }) => {
  // Generate a limb-like geometry for the ear
  const { geometry } = generateLimbGeometry({ skeleton, chain, options });
  // Compute a transformation matrix to fan and flatten the ear.  By
  // default, this is the identity.  If options.fanAngle is
  // specified, rotate around the Z axis (fan out).  If
  // options.flattenScale is specified, scale down the Y axis.
  const transform = new THREE.Matrix4();
  // Flattening: scale Y axis by flattenScale (0..1).  Use 1 if not provided.
  const flatten = (options as any).flattenScale ?? 1;
  const flattenMat = new THREE.Matrix4().makeScale(1, flatten, 1);
  transform.multiply(flattenMat);
  // Fan: rotate about Z axis by fanAngle
  if ((options as any).fanAngle && (options as any).fanAngle !== 0) {
    const rotMat = new THREE.Matrix4().makeRotationZ((options as any).fanAngle);
    transform.premultiply(rotMat);
  }
  const meta = { transform };
  return { geometry, meta };
};
