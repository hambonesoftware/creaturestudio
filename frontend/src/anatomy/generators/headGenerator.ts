// Head generator stub.
//
// Creates a head mesh (e.g. skull, dome) anchored at the end of a
// neck chain. Future implementation may use icosahedron subdivision
// or other primitive shapes. Skinning will typically weight the
// geometry entirely to the head bone.

import * as THREE from 'three';
import { AnatomyChain, HeadOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

export const generateHeadGeometry: AnatomyGenerator<HeadOptions> = ({ skeleton, chain, options }) => {
  // Determine the attachment point for the head: use the last bone in
  // the chain. If there are no bones, return an empty geometry.
  const points = sampleChainPositions(chain, skeleton);
  if (points.length === 0) {
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }
  const tip = points[points.length - 1];
  // Choose a radius; default to 0.3 if none provided.
  const radius = options?.radius ?? 0.3;
  // Use IcosahedronGeometry for a reasonably smooth sphere; detail
  // controls subdivision level.
  const detail = options?.detail ?? 1;
  const sphere = new THREE.IcosahedronGeometry(radius, detail);
  // Offset the sphere so its centre is at the tip of the neck. Some
  // creatures may prefer to offset along the chain direction; this
  // simple implementation attaches the head directly at the tip.
  sphere.translate(tip.x, tip.y, tip.z);
  // Assign skinning: weight all vertices to the last bone.
  const vertexCount = sphere.getAttribute('position').count;
  const { skinIndices, skinWeights } = assignSingleBoneSkin(points.length - 1, vertexCount);
  sphere.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  sphere.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  sphere.computeVertexNormals();
  return { geometry: sphere, meta: undefined };
};
