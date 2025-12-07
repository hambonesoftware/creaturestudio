import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  expandRadii,
  normalizeGeneratorParams,
  resolveChainPositions,
  sampleWorldPositionsFromBones,
} from "./utils.js";

function buildTorsoFromSpine(
  spineBones,
  radii = [],
  segments = 8,
  radiusProfile = null,
  capStart = true,
  capEnd = false,
  rumpBulgeDepth = null
) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const skinIndices = [];
  const skinWeights = [];

  const rings = spineBones.length;
  if (rings === 0) {
    return geometry;
  }

  const points = spineBones.map((b) => new THREE.Vector3(b.x, b.y, b.z));

  const tangents = [];
  for (let i = 0; i < rings; i += 1) {
    let t;
    if (rings === 1) {
      t = new THREE.Vector3(0, 0, 1);
    } else if (i === rings - 1) {
      t = points[i].clone().sub(points[i - 1]);
    } else {
      t = points[i + 1].clone().sub(points[i]);
    }
    if (t.lengthSq() === 0) {
      t.set(0, 0, 1);
    }
    t.normalize();
    tangents.push(t);
  }

  const frameNormals = [];
  const frameBinormals = [];

  for (let i = 0; i < rings; i += 1) {
    const t = tangents[i];

    if (i === 0) {
      const arbitrary = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);

      const n = new THREE.Vector3().crossVectors(t, arbitrary).normalize();
      const b = new THREE.Vector3().crossVectors(t, n).normalize();

      frameNormals.push(n);
      frameBinormals.push(b);
    } else {
      const nPrev = frameNormals[i - 1];

      let n = nPrev.clone().sub(t.clone().multiplyScalar(nPrev.dot(t)));

      if (n.lengthSq() < 1e-6) {
        const arbitrary = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        n = new THREE.Vector3().crossVectors(t, arbitrary);
      }

      n.normalize();
      const b = new THREE.Vector3().crossVectors(t, n).normalize();

      frameNormals.push(n);
      frameBinormals.push(b);
    }
  }

  const shoulderRadius = radii[1] ?? radii[0] ?? 1.5;
  const hipRadius = radii[0] ?? shoulderRadius;
  const midRadius = radii[2] ?? (hipRadius + shoulderRadius) / 2;

  const ringStarts = [];
  const uvVDenom = rings > 1 ? rings - 1 : 1;

  for (let ringIndex = 0; ringIndex < rings; ringIndex += 1) {
    const bone = spineBones[ringIndex];
    const center = points[ringIndex];
    const sNormalized = rings > 1 ? ringIndex / (rings - 1) : 0;

    let baseRadius = typeof radii[ringIndex] === "number" ? radii[ringIndex] : null;

    if (baseRadius === null) {
      if (ringIndex < 2) {
        baseRadius = hipRadius;
      } else if (ringIndex > rings - 3) {
        baseRadius = shoulderRadius;
      } else {
        baseRadius = midRadius;
      }
    }

    const n = frameNormals[ringIndex];
    const b = frameBinormals[ringIndex];

    const ringStart = vertices.length / 3;
    ringStarts.push(ringStart);

    for (let sideIndex = 0; sideIndex < segments; sideIndex += 1) {
      const theta = (sideIndex / segments) * Math.PI * 2.0;

      let radius = baseRadius;
      if (radiusProfile !== null) {
        radius = radiusProfile(sNormalized, theta, baseRadius);
      }

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const offset = n.clone().multiplyScalar(cosTheta * radius).add(b.clone().multiplyScalar(sinTheta * radius));

      const vertexPosition = center.clone().add(offset);

      vertices.push(vertexPosition.x, vertexPosition.y, vertexPosition.z);
      uvs.push(sideIndex / segments, sNormalized);

      const boneIndexA = bone.boneIndex ?? 0;
      const nextBoneIndex = spineBones[Math.min(ringIndex + 1, rings - 1)].boneIndex ?? boneIndexA;
      const blend = rings > 1 ? ringIndex / (rings - 1) : 0;

      skinIndices.push(boneIndexA, nextBoneIndex, 0, 0);
      skinWeights.push(1 - blend, blend, 0, 0);
    }
  }

  let startCapIndex = -1;
  let endCapIndex = -1;

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

  if (capStart && rings > 1) {
    const firstRingStart = ringStarts[0];
    const rumpRingIndex = 0;
    const rumpCenter = points[rumpRingIndex];

    let capCenter = rumpCenter.clone();

    if (typeof rumpBulgeDepth === "number") {
      const forward = points[Math.min(rings - 1, rumpRingIndex + 1)].clone().sub(rumpCenter);

      if (forward.lengthSq() < 1e-6) {
        forward.set(0, 0, 1);
      } else {
        forward.normalize();
      }

      const bodyBack = forward.clone().negate();
      capCenter = rumpCenter.clone().add(bodyBack.multiplyScalar(rumpBulgeDepth));
    }

    startCapIndex = vertices.length / 3;

    vertices.push(capCenter.x, capCenter.y, capCenter.z);
    uvs.push(0.5, 0.0);
    const rumpBoneIndex = spineBones[rumpRingIndex].boneIndex ?? 0;
    skinIndices.push(rumpBoneIndex, rumpBoneIndex, 0, 0);
    skinWeights.push(1, 0, 0, 0);

    for (let j = 0; j < segments; j += 1) {
      const a = startCapIndex;
      const b = firstRingStart + ((j + 1) % segments);
      const c = firstRingStart + j;
      indices.push(a, b, c);
    }
  }

  if (capEnd && rings > 1) {
    const lastRingStart = ringStarts[ringStarts.length - 1];
    const center = points[points.length - 1];
    endCapIndex = vertices.length / 3;

    vertices.push(center.x, center.y, center.z);
    uvs.push(0.5, 1.0);
    const neckBoneIndex = spineBones[spineBones.length - 1].boneIndex ?? 0;
    skinIndices.push(neckBoneIndex, neckBoneIndex, 0, 0);
    skinWeights.push(1, 0, 0, 0);

    for (let j = 0; j < segments; j += 1) {
      const a = endCapIndex;
      const b = lastRingStart + ((j + 1) % segments);
      const c = lastRingStart + j;
      indices.push(a, b, c);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const normals = new Float32Array((vertices.length / 3) * 3);
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  const normalAttr = geometry.getAttribute("normal");
  if (startCapIndex >= 0) {
    const n0 = tangents[0].clone().negate().normalize();
    normalAttr.setXYZ(startCapIndex, n0.x, n0.y, n0.z);
  }
  if (endCapIndex >= 0) {
    const n1 = tangents[tangents.length - 1].clone().normalize();
    normalAttr.setXYZ(endCapIndex, n1.x, n1.y, n1.z);
  }
  if (startCapIndex >= 0 || endCapIndex >= 0) {
    normalAttr.needsUpdate = true;
  }

  return geometry;
}

export function generateTorsoGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    sides = 28,
    radiusProfile,
    extendRumpToRearLegs,
    capStart = true,
    capEnd = true,
    lowPolySegments = 9,
    lowPolyWeldTolerance = 0,
    rumpBulgeDepth = null,
    partName = "torso",
  } = options;

  const lowPoly = options.runtimeOptions?.lowPoly === true || options.lowPoly === true;
  const targetSides = lowPoly ? Math.max(3, lowPolySegments) : Math.max(3, sides);
  const weldTolerance = lowPoly ? lowPolyWeldTolerance : 0;

  const boneIndexMap = new Map();
  if (skeleton?.bones) {
    skeleton.bones.forEach((bone, idx) => {
      boneIndexMap.set(bone.name, idx);
      bone.updateMatrixWorld(true);
    });
  }

  const chainPositions = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (chainPositions.length < 2) {
    return new THREE.SphereGeometry(0.5, targetSides, targetSides);
  }

  const spine = chainPositions.map((pos, idx) => {
    const boneName = chainBones?.[idx]?.name || bones[idx];
    const boneIndex = boneName && boneIndexMap.has(boneName) ? boneIndexMap.get(boneName) : 0;
    return { x: pos.x, y: pos.y, z: pos.z, boneIndex };
  });

  let expandedRadii = expandRadii(radii, spine.length, 0.35);

  if (extendRumpToRearLegs && skeleton) {
    const rumpCenter = chainPositions[0];
    const legPositions = sampleWorldPositionsFromBones(
      skeleton,
      Array.isArray(extendRumpToRearLegs.bones) ? extendRumpToRearLegs.bones : []
    );

    if (rumpCenter && legPositions.length > 0) {
      let maxDistance = 0;
      for (const pos of legPositions) {
        maxDistance = Math.max(maxDistance, rumpCenter.distanceTo(pos));
      }

      const margin =
        typeof extendRumpToRearLegs.extraMargin === "number" ? extendRumpToRearLegs.extraMargin : 0;
      const inflated = Math.max(expandedRadii[0] || 0.25, maxDistance + margin);
      const adjusted = [...expandedRadii];
      adjusted[0] = inflated;
      expandedRadii = adjusted;
    }
  }

  const geometry = buildTorsoFromSpine(
    spine,
    expandedRadii,
    targetSides,
    radiusProfile,
    capStart,
    capEnd,
    rumpBulgeDepth
  );

  if (lowPoly && weldTolerance > 0) {
    geometry.deleteAttribute("normal");
    const welded = mergeVertices(geometry, weldTolerance);
    welded.computeVertexNormals();
    welded.name = `${partName}_Torso`;
    return welded;
  }

  geometry.name = `${partName}_Torso`;
  return geometry;
}
