// General torso generator stub.
//
// This module provides the signature for a torso generator that builds a
// tube around a spine chain. The implementation will be provided in
// Phase 3, based on the algorithms observed in zoo_reference.

import * as THREE from 'three';
import { AnatomyChain, TorsoOptions, AnatomyGenerator } from '../core/types.js';

/**
 * Generates a torso geometry along a given chain of spine bones. The
 * returned BufferGeometry should have position, normal, uv and skin
 * attributes, but at this stage it is an empty placeholder. See
 * docs/anatomy_design_v2.md for intended usage.
 */
export const generateTorsoGeometry: AnatomyGenerator<TorsoOptions> = ({ skeleton, chain, options }) => {
  // TODO: implement ring‑based extrusion using sampleChainPositions,
  // interpolateRadii and evaluateProfile from core modules. Weld
  // vertices and apply rump bulge/extension based on options.
  const geometry = new THREE.BufferGeometry();
  return { geometry, meta: undefined };
};
