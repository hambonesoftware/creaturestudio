// General torso generator.
//
// This module implements a generalized torso generator that builds a
// tube around a spine chain. It samples bone positions, interpolates
// radii and profiles, constructs rings and quads, and assigns skin
// weights based on the bone index. The design is inspired by the
// zoo_reference Elephant and is suitable for quadrupeds and bipeds.

import * as THREE from 'three';
import {
  AnatomyChain,
  TorsoOptions,
  AnatomyGenerator,
} from '../core/types.js';
import { sampleChainPositions } from '../core/chains.js';
import { interpolateRadii, evaluateProfile } from '../core/sampling.js';
import { assignSingleBoneSkin } from '../core/skinning.js';

/**
 * Generates a torso geometry along a given chain of spine bones.
 *
 * @param skeleton THREE.Skeleton
 * @param chain AnatomyChain specifying the spine bones and radii
 * @param options TorsoOptions controlling segment count, sides, low‑poly mode, etc.
 */
export const generateTorsoGeometry: AnatomyGenerator<TorsoOptions> = ({ skeleton, chain, options }) => {
  // Sample world positions along the spine chain. Each bone defines
  // a ring location. We use these positions as the path for a
  // cylindrical extrusion. The number of segments equals the number
  // of bones in the chain.
  const positions = sampleChainPositions(chain, skeleton);
  const nSegments = positions.length;
  if (nSegments < 2) {
    // Not enough bones to form a torso; return empty geometry.
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }

  // Determine the number of radial subdivisions. Use the low‑poly
  // setting to reduce sides if provided.
  const defaultSides = 8;
  const sides = options.lowPoly && options.lowPolySegments
    ? options.lowPolySegments
    : options.sides ?? defaultSides;

  // Compute radii for each ring using radii array or default. If
  // chain.radii is defined, interpolate between them across all
  // segments. Otherwise use a uniform radius of 1.0. Apply any
  // radius profile and rump bulge option.
  let radii = chain.radii ? interpolateRadii(chain, nSegments) : new Array(nSegments).fill(1.0);
  for (let i = 0; i < nSegments; i++) {
    const t = nSegments > 1 ? i / (nSegments - 1) : 0;
    const profileScale = evaluateProfile(chain, t);
    radii[i] *= profileScale;
  }
  // Apply rump bulge by inflating the first ring(s). A simple
  // approximation multiplies the first two rings by (1 + depth).
  if (options.rumpBulgeDepth && options.rumpBulgeDepth > 0) {
    const bulge = 1 + options.rumpBulgeDepth;
    radii[0] *= bulge;
    if (nSegments > 1) radii[1] *= bulge;
  }

  // Prepare arrays to accumulate geometry data.
  const verts: number[] = [];
  const norms: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Helper to compute an orthonormal basis for a ring. Given a
  // direction vector, produce two perpendicular vectors spanning
  // the ring's local X and Y axes.
  function computeBasis(dir: THREE.Vector3): { xAxis: THREE.Vector3; yAxis: THREE.Vector3 } {
    const normalized = dir.clone().normalize();
    // Choose an arbitrary up vector. If the direction is too
    // parallel to the global Y axis, use X axis instead to avoid a
    // zero cross product.
    const globalUp = Math.abs(normalized.y) > 0.999
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    let xAxis = new THREE.Vector3().crossVectors(globalUp, normalized);
    if (xAxis.lengthSq() < 1e-6) {
      xAxis = new THREE.Vector3(1, 0, 0);
    }
    xAxis.normalize();
    const yAxis = new THREE.Vector3().crossVectors(normalized, xAxis).normalize();
    return { xAxis, yAxis };
  }

  // Build vertices, normals and uvs for each ring.
  for (let i = 0; i < nSegments; i++) {
    // Compute direction to the next point. For the last ring,
    // approximate direction using the previous segment.
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
      const offset = xAxis.clone().multiplyScalar(cos * radius).add(
        yAxis.clone().multiplyScalar(sin * radius)
      );
      const vert = positions[i].clone().add(offset);
      verts.push(vert.x, vert.y, vert.z);
      // Normal points outward: same as offset normalized.
      const normal = offset.clone().normalize();
      norms.push(normal.x, normal.y, normal.z);
      // UV coordinates: u along circumference, v along spine.
      const u = j / sides;
      const v = i / (nSegments - 1);
      uvs.push(u, v);
    }
  }

  // Generate triangle indices. Each quad between rings forms two
  // triangles. Use modulo to wrap around the ring.
  for (let i = 0; i < nSegments - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j;
      const b = i * sides + ((j + 1) % sides);
      const c = (i + 1) * sides + j;
      const d = (i + 1) * sides + ((j + 1) % sides);
      // Triangle 1
      indices.push(a, c, b);
      // Triangle 2
      indices.push(b, c, d);
    }
  }

  // Skinning: assign each ring's vertices to the corresponding bone.
  const vertexCount = verts.length / 3;
  // Each bone influences exactly its ring; weight = 1.0.
  const { skinIndices, skinWeights } = assignSingleBoneSkin(0, vertexCount);
  // assignSingleBoneSkin assigns all vertices to bone 0; update to reflect ring index.
  for (let v = 0; v < vertexCount; v++) {
    const ringIndex = Math.floor(v / sides);
    skinIndices[v * 4] = ringIndex < chain.boneNames.length ? ringIndex : chain.boneNames.length - 1;
    skinWeights[v * 4] = 1.0;
  }

  // Assemble BufferGeometry.
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  return { geometry, meta: undefined };
};