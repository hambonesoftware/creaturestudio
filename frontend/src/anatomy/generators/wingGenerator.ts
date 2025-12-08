// Wing generator stub.
//
// Wings are complex membranes anchored along a series of bones.
// This stub defines the signature for a wing generator. Future
// implementations will create a mesh representing the membrane and
// leading edges based on span and thickness profiles.

import * as THREE from 'three';
import { AnatomyChain, WingOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { evaluateProfile } from '../core/sampling.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

export const generateWingGeometry: AnatomyGenerator<WingOptions> = ({ skeleton, chain, options }) => {
  // Sample the positions of the wing bones. We'll create a flat
  // membrane by attaching a strip below the chain. Each bone
  // contributes two vertices: one at the bone position and one
  // offset by a span dependent vector. This is a simplified wing
  // representation useful for visualising a membrane.
  const bones = sampleChainPositions(chain, skeleton);
  if (bones.length < 2) {
    // Not enough bones to construct a wing; return empty geometry
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }
  // Compute the total length of the chain to scale the span. We sum
  // distances between consecutive bones.
  let chainLength = 0;
  for (let i = 0; i < bones.length - 1; i++) {
    chainLength += bones[i].distanceTo(bones[i + 1]);
  }
  const span = (options?.span ?? 1) * chainLength;
  // Prepare arrays for positions, uvs, indices, skin attributes.
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const boneIndices: number[] = [];
  const boneWeights: number[] = [];
  // Determine thickness profile: use provided thicknessProfile or
  // default linear 0→1 across the chain. A thickness of 0 at the
  // root produces no membrane; at the tip the membrane is full span.
  const thicknessProfile = (t: number) => {
    if (typeof options?.thicknessProfile === 'function') {
      return options.thicknessProfile(t);
    }
    return t;
  };
  // For each bone create two vertices: top (bone) and bottom (offset).
  bones.forEach((pt, i) => {
    const t = bones.length > 1 ? i / (bones.length - 1) : 0;
    const thickness = thicknessProfile(t);
    // Define offset direction: here we choose the negative Y axis so
    // wings extend downwards relative to the creature. Multiply by
    // span and thickness to get the offset vector length.
    const offsetVec = new THREE.Vector3(0, -1, 0).multiplyScalar(span * thickness);
    const top = pt.clone();
    const bottom = pt.clone().add(offsetVec);
    // Push positions (top then bottom)
    positions.push(top.x, top.y, top.z);
    positions.push(bottom.x, bottom.y, bottom.z);
    // UV coordinates: u based on bone index, v is 0 for top and 1 for bottom
    uvs.push(t, 0);
    uvs.push(t, 1);
    // Skinning: assign both vertices entirely to this bone
    boneIndices.push(i, 0, 0, 0);
    boneIndices.push(i, 0, 0, 0);
    boneWeights.push(1, 0, 0, 0);
    boneWeights.push(1, 0, 0, 0);
  });
  // Create indices for a strip: connect quads between consecutive bones
  const vertPerBone = 2;
  for (let i = 0; i < bones.length - 1; i++) {
    const a = i * vertPerBone;
    const b = a + 1;
    const c = (i + 1) * vertPerBone;
    const d = c + 1;
    // First triangle (top-left, bottom-left, top-right)
    indices.push(a, b, c);
    // Second triangle (bottom-left, bottom-right, top-right)
    indices.push(b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(boneIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(boneWeights, 4));
  geometry.computeVertexNormals();
  return { geometry, meta: undefined };
};
