// Nose/trunk/tusk generator stub.
//
// This wrapper around the tail generator chooses an appropriate root
// bone and then delegates to generateTailGeometry. It exists as a
// separate generator to allow specialised options such as length
// scaling and fallback root bones.

import * as THREE from 'three';
import { AnatomyChain, NoseOptions, AnatomyGenerator } from '../core/types.js';
import { generateTailGeometry } from './tailGenerator.js';

export const generateNoseGeometry: AnatomyGenerator<NoseOptions> = ({ skeleton, chain, options }) => {
  // TODO: resolve rootBone using options.rootBone and options.fallbackRoots.
  // Then call generateTailGeometry with adjusted radii/lengthScale.
  return generateTailGeometry({ skeleton, chain, options });
};
