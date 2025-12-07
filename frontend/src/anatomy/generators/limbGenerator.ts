// General limb generator
//
// This module defines a generic limb generator capable of producing
// arms, legs or other cylindrical appendages. The implementation
// samples bone positions, interpolates or uses provided radii, and
// extrudes a tube along the limb path. Skinning attributes are
// assigned so that each ring is influenced by the appropriate bone.

import * as THREE from 'three';
import {
  AnatomyChain,
  LimbOptions,
  AnatomyGenerator,
} from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

/**
 * Generates a limb geometry along a given chain of bones. Limbs may be
 * subdivided into multiple rings per bone segment for smoother bends.
 *
 * @param skeleton The skeleton containing the chain
 * @param chain The AnatomyChain describing the bone names and optional radii
 * @param options Additional options controlling sides, rings and radii
 */
export const generateLimbGeometry: AnatomyGenerator<LimbOptions> = ({ skeleton, chain, options }) => {
  // Sample the positions of the bones in this limb.  For limbs we
  // optionally insert extra rings between bones to control smoothness.
  const bonePositions = sampleChainPositions(chain, skeleton);
  const nBones = bonePositions.length;
  if (nBones < 2) {
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }
  const ringsPerSegment = options.rings && options.rings > 0 ? options.rings : 1;
  // Build a list of positions along the limb path.  For each bone
  // segment, subdivide into `ringsPerSegment` pieces, including the
  // start but excluding the end (the next bone will include its start).
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < nBones - 1; i++) {
    const start = bonePositions[i];
    const end = bonePositions[i + 1];
    for (let j = 0; j < ringsPerSegment; j++) {
      const t = j / ringsPerSegment;
      positions.push(new THREE.Vector3().lerpVectors(start, end, t));
    }
  }
  // Push the final bone position
  positions.push(bonePositions[nBones - 1].clone());
  const nSegments = positions.length;

  // Determine radial subdivisions
  const defaultSides = 6;
  const sides = options.lowPoly && options.lowPolySegments ? options.lowPolySegments : options.sides ?? defaultSides;

  // Determine radii: use chain.radii if provided, else default 0.5
  let radii: number[];
  if (chain.radii) {
    radii = interpolateRadii(chain, nSegments);
  } else if (options.radii) {
    // Use LimbOptions.radii if defined
    radii = [];
    for (let i = 0; i < options.radii.length; i++) radii.push(options.radii[i]);
    // If the number of provided radii does not match segments, interpolate
    if (radii.length !== nSegments) {
      radii = new Array(nSegments).fill(radii[0]);
    }
  } else {
    radii = new Array(nSegments).fill(0.5);
  }
  // Apply any profile; limbs typically don't have custom profiles so use uniform 1.
  for (let i = 0; i < nSegments; i++) {
    radii[i] *= evaluateProfile(chain, nSegments > 1 ? i / (nSegments - 1) : 0);
  }

  // Prepare geometry arrays
  const verts: number[] = [];
  const norms: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Compute orthonormal basis helper (same as torso)
  function computeBasis(dir: THREE.Vector3): { xAxis: THREE.Vector3; yAxis: THREE.Vector3 } {
    const normalized = dir.clone().normalize();
    const globalUp = Math.abs(normalized.y) > 0.999 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    let xAxis = new THREE.Vector3().crossVectors(globalUp, normalized);
    if (xAxis.lengthSq() < 1e-6) {
      xAxis = new THREE.Vector3(1, 0, 0);
    }
    xAxis.normalize();
    const yAxis = new THREE.Vector3().crossVectors(normalized, xAxis).normalize();
    return { xAxis, yAxis };
  }

  // Build vertices
  for (let i = 0; i < nSegments; i++) {
    let dir: THREE.Vector3;
    if (i < nSegments - 1) {
      dir = positions[i + 1].clone().sub(positions[i]);
    } else {
      dir = positions[i].clone().sub(positions[i - 1]);
    }
    const { xAxis, yAxis } = computeBasis(dir);
    const radius = radii[i];
    for (let j = 0; j < sides; j++) {
      const angle = (j / sides) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const offset = xAxis.clone().multiplyScalar(cos * radius).add(yAxis.clone().multiplyScalar(sin * radius));
      const vert = positions[i].clone().add(offset);
      verts.push(vert.x, vert.y, vert.z);
      const normal = offset.clone().normalize();
      norms.push(normal.x, normal.y, normal.z);
      const u = j / sides;
      const v = i / (nSegments - 1);
      uvs.push(u, v);
    }
  }
  // Build indices
  for (let i = 0; i < nSegments - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j;
      const b = i * sides + ((j + 1) % sides);
      const c = (i + 1) * sides + j;
      const d = (i + 1) * sides + ((j + 1) % sides);
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  // Skinning: assign each ring to a bone index.  Because we may
  // subdivide segments, approximate by mapping ring index to bone
  // index by dividing by ringsPerSegment.
  const vertexCount = verts.length / 3;
  const { skinIndices, skinWeights } = assignSingleBoneSkin(0, vertexCount);
  for (let v = 0; v < vertexCount; v++) {
    const ringIndex = Math.floor(v / sides);
    const boneIndex = Math.min(Math.floor(ringIndex / ringsPerSegment), chain.boneNames.length - 1);
    skinIndices[v * 4] = boneIndex;
    skinWeights[v * 4] = 1.0;
  }
  // Build geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  return { geometry, meta: undefined };
};
