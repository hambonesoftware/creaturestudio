// Tail/trunk generator
//
// A tail is a tapered tube following a chain of bones. The nose and
// trunk generators reuse this logic. This implementation samples
// positions along the chain, computes radii from options or the
// chain definition, constructs rings and quads, and assigns skin
// indices per ring.

import * as THREE from 'three';
import {
  AnatomyChain,
  TailOptions,
  AnatomyGenerator,
} from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii } from '../core/sampling.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

export const generateTailGeometry: AnatomyGenerator<TailOptions> = ({ skeleton, chain, options }) => {
  // Sample positions along the tail chain.  Tails can often have
  // fewer bones; if there are fewer than 2, return an empty mesh.
  const positions = sampleChainPositions(chain, skeleton);
  const nSegments = positions.length;
  if (nSegments < 2) {
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }

  // Determine number of sides around the tube.  Use low‑poly setting
  // only if provided; default to 5 sides for thin tails.
  const sides = options.sides ?? 5;

  // Determine radii for each ring.  Preference order:
  // 1. chain.radii (already defined on chain)
  // 2. options.radii (per‑segment radii provided)
  // 3. base/mid/tip radii from options
  let radii: number[];
  if (chain.radii) {
    radii = interpolateRadii(chain, nSegments);
  } else if (options.radii) {
    radii = [];
    for (let i = 0; i < options.radii.length; i++) radii.push(options.radii[i]);
    if (radii.length !== nSegments) {
      radii = new Array(nSegments).fill(radii[0]);
    }
  } else {
    const base = options.baseRadius ?? 0.2;
    const mid = options.midRadius ?? base * 0.6;
    const tip = options.tipRadius ?? base * 0.3;
    radii = [];
    for (let i = 0; i < nSegments; i++) {
      const t = nSegments > 1 ? i / (nSegments - 1) : 0;
      // Quadratic interpolation base → mid → tip
      const radius = base * Math.pow(1 - t, 2) + 2 * mid * (1 - t) * t + tip * Math.pow(t, 2);
      radii.push(radius);
    }
  }

  // Apply vertical offset if specified.  We'll add this offset to
  // each ring’s vertices along the Y axis.
  const yOffset = options.yOffset ?? 0;

  const verts: number[] = [];
  const norms: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Helper for orthonormal basis (copied from torso)
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
      vert.y += yOffset;
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
  // Assign skin indices: each ring is driven by its respective bone
  const vertexCount = verts.length / 3;
  const { skinIndices, skinWeights } = assignSingleBoneSkin(0, vertexCount);
  for (let v = 0; v < vertexCount; v++) {
    const ringIndex = Math.floor(v / sides);
    const boneIndex = Math.min(ringIndex, chain.boneNames.length - 1);
    skinIndices[v * 4] = boneIndex;
    skinWeights[v * 4] = 1.0;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  return { geometry, meta: undefined };
};
