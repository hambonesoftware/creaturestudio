// Head generator
//
// Creates a head mesh (e.g. skull, dome) anchored at the end of a
// neck chain. The head is generated as an icosahedron (optionally
// subdivided) aligned along the chain direction, positioned at the
// tip, and skinned to the last bone in the chain.

import * as THREE from 'three';
import { AnatomyChain, HeadOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

export const generateHeadGeometry: AnatomyGenerator<HeadOptions> = ({ skeleton, chain, options }) => {
  // Determine the position of the head.  Use the first bone in the
  // chain (usually the head bone) as the anchor.  If there are
  // multiple bones, use the last one as the head tip and orient the
  // sphere along the chain.
  const positions = sampleChainPositions(chain, skeleton);
  const headPos = positions[positions.length - 1].clone();
  const basePos = positions[0].clone();
  const dir = headPos.clone().sub(basePos);
  // Choose a radius and detail for the head
  const radius = options.radius ?? 0.5;
  const detail = options.detail ?? 0;
  // Create an icosahedron geometry for the head
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  // Rotate the head so that its Z axis aligns with the direction of the neck
  if (dir.lengthSq() > 1e-6) {
    const defaultAxis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultAxis.normalize(), dir.clone().normalize());
    geo.applyQuaternion(quaternion);
  }
  // Translate geometry to head position
  geo.translate(headPos.x, headPos.y, headPos.z);
  // Skinning: assign all vertices to the last bone in the chain
  const vertexCount = (geo.getAttribute('position').array.length) / 3;
  const { skinIndices, skinWeights } = assignSingleBoneSkin(chain.boneNames.length - 1, vertexCount);
  // Create BufferGeometry to attach skin indices
  const geometry = new THREE.BufferGeometry().copy(geo as any);
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  return { geometry, meta: undefined };
};
