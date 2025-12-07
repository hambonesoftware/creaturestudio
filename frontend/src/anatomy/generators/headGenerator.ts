// Head generator stub.
//
// Creates a head mesh (e.g. skull, dome) anchored at the end of a
// neck chain. Future implementation may use icosahedron subdivision
// or other primitive shapes. Skinning will typically weight the
// geometry entirely to the head bone.

import * as THREE from 'three';
import { AnatomyChain, HeadOptions, AnatomyGenerator } from '../core/types.js';

export const generateHeadGeometry: AnatomyGenerator<HeadOptions> = ({ skeleton, chain, options }) => {
  // TODO: determine the neck tip and head bone positions, create an
  // ellipsoid or other primitive, scale it based on options.radius,
  // and align it along the chain direction. Assign single‑bone skin.
  const geometry = new THREE.BufferGeometry();
  return { geometry, meta: undefined };
};
