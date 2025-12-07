// Wing generator
//
// Wings are complex membranes anchored along a series of bones.
// This implementation creates a simple triangular or quad mesh
// representing the wing membrane. Each row of vertices corresponds
// to a wing bone, and columns subdivide the span of the wing. The
// geometry is skinned so each row is driven by its corresponding bone.

import * as THREE from 'three';
import { AnatomyChain, WingOptions, AnatomyGenerator } from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

export const generateWingGeometry: AnatomyGenerator<WingOptions> = ({ skeleton, chain, options }) => {
  // Build a simple membrane that spans outwards from each wing bone.
  const positions = sampleChainPositions(chain, skeleton);
  const nSegments = positions.length;
  if (nSegments < 2) {
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }
  // Determine span (width) relative to bone segment length.  If not
  // provided, default to the average distance between bones.
  let span = options.span;
  if (!span) {
    let total = 0;
    for (let i = 0; i < nSegments - 1; i++) {
      total += positions[i].distanceTo(positions[i + 1]);
    }
    span = total / (nSegments - 1);
  }
  // Determine membrane resolution (number of subdivisions across the wing).
  const memRes = options.membraneResolution ?? 4;
  // Arrays to hold geometry data
  const verts: number[] = [];
  const norms: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  // Precompute cross direction for each segment
  const crossDirs: THREE.Vector3[] = [];
  for (let i = 0; i < nSegments; i++) {
    let dir: THREE.Vector3;
    if (i < nSegments - 1) {
      dir = positions[i + 1].clone().sub(positions[i]);
    } else {
      dir = positions[i].clone().sub(positions[i - 1]);
    }
    const globalUp = Math.abs(dir.y) > 0.999 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    let cross = new THREE.Vector3().crossVectors(dir, globalUp);
    if (cross.lengthSq() < 1e-6) {
      cross = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0));
    }
    cross.normalize().multiplyScalar(span);
    crossDirs.push(cross);
  }
  // Build vertices for each segment along the wing and width subdivision
  for (let i = 0; i < nSegments; i++) {
    const base = positions[i];
    const cross = crossDirs[i];
    for (let j = 0; j <= memRes; j++) {
      const t = j / memRes;
      // Offset along the wing span; thicknessProfile could modify scaling
      let thickness = 1;
      if (options.thicknessProfile) {
        thickness = options.thicknessProfile(t);
      }
      const offset = cross.clone().multiplyScalar(t * thickness);
      const vert = base.clone().add(offset);
      verts.push(vert.x, vert.y, vert.z);
      // Approximate normal as perpendicular to the membrane plane: use dir cross cross (roughly up)
      const normal = cross
        .clone()
        .normalize()
        .cross(
          new THREE.Vector3().subVectors(
            i < nSegments - 1 ? positions[i + 1] : positions[i],
            positions[Math.max(0, i - 1)]
          ).normalize()
        )
        .normalize();
      // If normal is degenerate, fallback to global up
      if (!isFinite(normal.x) || !isFinite(normal.y) || !isFinite(normal.z)) {
        normal.set(0, 1, 0);
      }
      norms.push(normal.x, normal.y, normal.z);
      // UVs: u across width, v along wing
      const u = t;
      const v = i / (nSegments - 1);
      uvs.push(u, v);
    }
  }
  // Build indices: connect grid (nSegments x (memRes + 1))
  const rowSize = memRes + 1;
  for (let i = 0; i < nSegments - 1; i++) {
    for (let j = 0; j < memRes; j++) {
      const a = i * rowSize + j;
      const b = i * rowSize + (j + 1);
      const c = (i + 1) * rowSize + j;
      const d = (i + 1) * rowSize + (j + 1);
      // Two triangles per quad
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  // Skinning: assign each vertex to the corresponding bone along the wing
  const vertexCount = verts.length / 3;
  const { skinIndices, skinWeights } = assignSingleBoneSkin(0, vertexCount);
  for (let v = 0; v < vertexCount; v++) {
    // Determine which segment this vertex belongs to based on row
    const row = Math.floor(v / (memRes + 1));
    const boneIndex = Math.min(row, chain.boneNames.length - 1);
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
