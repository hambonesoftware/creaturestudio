// General limb generator stub.
//
// This module defines a generic limb generator capable of producing
// arms, legs or other cylindrical appendages. The full algorithm will
// mirror the reference LimbGenerator but support arbitrary chains and
// radii profiles. For now it returns an empty BufferGeometry.

import * as THREE from 'three';
import { AnatomyChain, LimbOptions, AnatomyGenerator } from '../core/types.js';

export const generateLimbGeometry: AnatomyGenerator<LimbOptions> = ({ skeleton, chain, options }) => {
  // TODO: sample chain positions, create rings per segment, blend
  // radii and assign skin weights using assignBlendSkin. Optionally
  // accept a custom number of rings per segment (options.rings).
  const geometry = new THREE.BufferGeometry();
  return { geometry, meta: undefined };
};
