// Wing generator stub.
//
// Wings are complex membranes anchored along a series of bones.
// This stub defines the signature for a wing generator. Future
// implementations will create a mesh representing the membrane and
// leading edges based on span and thickness profiles.

import * as THREE from 'three';
import { AnatomyChain, WingOptions, AnatomyGenerator } from '../core/types.js';

export const generateWingGeometry: AnatomyGenerator<WingOptions> = ({ skeleton, chain, options }) => {
  // TODO: implement wing membrane generation by sampling chain
  // positions, sweeping a profile along the span, and assigning
  // appropriate skin indices. A simple implementation might start by
  // creating a flat quad stretched between bones.
  const geometry = new THREE.BufferGeometry();
  return { geometry, meta: undefined };
};
