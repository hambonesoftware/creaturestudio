import * as THREE from "three";
import {
  normalizeGeneratorParams,
  resolveChainPositions,
} from "./utils.js";

function bridgeRings(startA, startB, sides, indices) {
  for (let j = 0; j < sides; j += 1) {
    const next = (j + 1) % sides;
    const a = startA + j;
    const b = startA + next;
    const c = startB + next;
    const d = startB + j;
    indices.push(a, b, d, b, c, d);
  }
}

function buildBufferGeometry({ positions, normals, skinIndices, skinWeights, uvs, indices }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function generateTailGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    baseRadius = 0.12,
    midRadius = 0.07,
    tipRadius = 0.05,
    sides = 14,
    partName = "tail",
  } = options;

  const lowPoly = options.runtimeOptions?.lowPoly === true || options.lowPoly === true;
  const targetSides = Math.max(3, lowPoly ? Math.min(sides, 10) : sides);

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
    return new THREE.CylinderGeometry(baseRadius, tipRadius, 0.8, targetSides);
  }

  const allTailBoneNames = chainBones?.map((b) => b.name) || bones;
  const tailPoints = chainPositions;

  let radiiProfile;
  if (radii.length > 0) {
    radiiProfile = radii;
  } else if (tailPoints.length === 4) {
    radiiProfile = [baseRadius, baseRadius, midRadius, tipRadius];
  } else {
    radiiProfile = [];
    for (let i = 0; i < tailPoints.length; i += 1) {
      const t = tailPoints.length > 1 ? i / (tailPoints.length - 1) : 0;
      radiiProfile.push(THREE.MathUtils.lerp(baseRadius, tipRadius, t));
    }
  }

  const tangents = [];
  const normalsFrame = [];
  const binormalsFrame = [];

  for (let i = 0; i < tailPoints.length; i += 1) {
    const center = tailPoints[i];
    let axis;
    if (i === tailPoints.length - 1) {
      axis = center.clone().sub(tailPoints[i - 1]);
    } else {
      axis = tailPoints[i + 1].clone().sub(center);
    }
    axis.normalize();
    tangents.push(axis);
  }

  for (let i = 0; i < tailPoints.length; i += 1) {
    const t = tangents[i];

    if (i === 0) {
      const arbitrary = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);

      const n = new THREE.Vector3().crossVectors(t, arbitrary).normalize();
      const b = new THREE.Vector3().crossVectors(t, n).normalize();

      normalsFrame.push(n);
      binormalsFrame.push(b);
    } else {
      const nPrev = normalsFrame[i - 1];

      let n = nPrev.clone().sub(t.clone().multiplyScalar(nPrev.dot(t)));

      if (n.lengthSq() < 1e-6) {
        const arbitrary = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        n = new THREE.Vector3().crossVectors(t, arbitrary);
      }

      n.normalize();
      const b = new THREE.Vector3().crossVectors(t, n).normalize();

      normalsFrame.push(n);
      binormalsFrame.push(b);
    }
  }

  const positions = [];
  const normals = [];
  const skinIndices = [];
  const skinWeights = [];
  const uvs = [];
  const indices = [];
  const ringStarts = [];

  const segmentCount = tailPoints.length;
  const uvVDenom = segmentCount > 1 ? segmentCount - 1 : 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const center = tailPoints[i];
    const radius = radiiProfile[i];
    const n = normalsFrame[i];
    const b = binormalsFrame[i];

    const ringStartIndex = positions.length / 3;
    ringStarts.push(ringStartIndex);

    const mainBoneName = allTailBoneNames[i];
    const mainBone = mainBoneName && boneIndexMap.has(mainBoneName) ? boneIndexMap.get(mainBoneName) : 0;

    for (let j = 0; j < targetSides; j += 1) {
      const theta = (j / targetSides) * Math.PI * 2.0;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const offset = n.clone().multiplyScalar(cosTheta * radius).add(b.clone().multiplyScalar(sinTheta * radius));

      const v = center.clone().add(offset);

      positions.push(v.x, v.y, v.z);

      const norm = offset.clone().normalize();
      normals.push(norm.x, norm.y, norm.z);

      uvs.push(j / targetSides, i / uvVDenom);

      skinIndices.push(mainBone, mainBone, 0, 0);
      skinWeights.push(1, 0, 0, 0);
    }
  }

  for (let seg = 0; seg < segmentCount - 1; seg += 1) {
    bridgeRings(ringStarts[seg], ringStarts[seg + 1], targetSides, indices);
  }

  let geometry = buildBufferGeometry({
    positions,
    normals,
    skinIndices,
    skinWeights,
    uvs,
    indices,
  });

  if (geometry.index) {
    geometry = geometry.toNonIndexed();
  }

  geometry.name = `${partName}_Tail`;
  return geometry;
}
