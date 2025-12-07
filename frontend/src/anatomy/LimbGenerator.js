import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  expandRadii,
  normalizeGeneratorParams,
  resolveChainPositions,
} from "./utils.js";

function buildLimbSegment(
  start,
  end,
  radiusStart,
  radiusEnd,
  segments = 8,
  rings = 5,
  boneStart = 0,
  boneEnd = 0,
  uvOffset = 0,
  uvSpan = 1
) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const skinIndices = [];
  const skinWeights = [];

  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length === 0) return geometry;
  direction.normalize();

  const up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(direction.dot(up)) > 0.99) {
    up.set(1, 0, 0);
  }
  const side = new THREE.Vector3().crossVectors(direction, up).normalize();
  const binormal = new THREE.Vector3().crossVectors(direction, side).normalize();

  for (let i = 0; i < rings; i += 1) {
    const t = i / (rings - 1);
    const center = new THREE.Vector3().lerpVectors(start, end, t);
    const radius = THREE.MathUtils.lerp(radiusStart, radiusEnd, t);
    const angleStep = (2 * Math.PI) / segments;

    for (let j = 0; j < segments; j += 1) {
      const angle = j * angleStep;
      const offset = side
        .clone()
        .multiplyScalar(Math.cos(angle) * radius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius));

      const v = center.clone().add(offset);
      vertices.push(v.x, v.y, v.z);
      uvs.push(j / segments, uvOffset + t * uvSpan);

      const weightEnd = t;
      const weightStart = 1 - weightEnd;
      skinIndices.push(boneStart, boneEnd, 0, 0);
      skinWeights.push(weightStart, weightEnd, 0, 0);
    }
  }

  for (let i = 0; i < rings - 1; i += 1) {
    for (let j = 0; j < segments; j += 1) {
      const next = (j + 1) % segments;
      const a = i * segments + j;
      const b = i * segments + next;
      const c = (i + 1) * segments + next;
      const d = (i + 1) * segments + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function generateLimbGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    sides = 16,
    rings = 5,
    partName = "limb",
  } = options;

  const lowPoly = options.runtimeOptions?.lowPoly === true || options.lowPoly === true;
  const targetSides = lowPoly
    ? Math.max(3, options.lowPolySegments || sides || 8)
    : Math.max(3, sides);

  const boneIndexMap = new Map();
  if (skeleton?.bones) {
    skeleton.bones.forEach((bone, idx) => {
      boneIndexMap.set(bone.name, idx);
      bone.updateMatrixWorld(true);
    });
  }

  const points = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (points.length < 2) {
    return new THREE.CylinderGeometry(0.15, 0.15, 0.5, targetSides);
  }

  const expandedRadii = expandRadii(radii, points.length, 0.2);

  const limbSegments = [];
  const segmentSpan = 1 / Math.max(1, points.length - 1);
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const rStart = expandedRadii[i] ?? expandedRadii[expandedRadii.length - 1];
    const rEnd = expandedRadii[i + 1] ?? rStart;
    const boneStartName = chainBones?.[i]?.name || bones[i];
    const boneEndName = chainBones?.[i + 1]?.name || bones[i + 1];
    const boneStart = boneStartName && boneIndexMap.has(boneStartName) ? boneIndexMap.get(boneStartName) : 0;
    const boneEnd = boneEndName && boneIndexMap.has(boneEndName) ? boneIndexMap.get(boneEndName) : boneStart;
    limbSegments.push(
      buildLimbSegment(
        start,
        end,
        rStart,
        rEnd,
        targetSides,
        rings,
        boneStart,
        boneEnd,
        i * segmentSpan,
        segmentSpan
      )
    );
  }

  const geometry = mergeGeometries(limbSegments, false);
  geometry.name = `${partName}_Limb`;
  return geometry;
}
