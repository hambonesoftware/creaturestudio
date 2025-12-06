import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ElephantDefinition } from "./ElephantDefinition.js";
import { createElephantSkinMaterial } from "./ElephantSkinMaterial.js";

function averageSizeRadius(sizeEntry, fallback = 0.35) {
  if (Array.isArray(sizeEntry) && sizeEntry.length >= 3) {
    return (Math.abs(sizeEntry[0]) + Math.abs(sizeEntry[1]) + Math.abs(sizeEntry[2])) / 3;
  }
  if (typeof sizeEntry === "number") {
    return Math.abs(sizeEntry);
  }
  return fallback;
}

function getBoneWorldPosition(bonesByName, name) {
  const bone = bonesByName.get(name);
  if (!bone) {
    return null;
  }
  const pos = new THREE.Vector3();
  bone.getWorldPosition(pos);
  return pos;
}

function createSkinnedCylinder({
  start,
  end,
  startIndex,
  endIndex,
  radius,
  radialSegments = 12,
  name = "segment",
}) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const safeLength = length > 1e-5 ? length : radius * 0.5;
  const height = safeLength;
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    Math.max(3, radialSegments),
    1,
    true
  );

  const positionAttr = geometry.getAttribute("position");
  const vertexCount = positionAttr ? positionAttr.count : 0;
  const skinIndices = new Uint16Array(vertexCount * 4);
  const skinWeights = new Float32Array(vertexCount * 4);

  for (let i = 0; i < vertexCount; i += 1) {
    const y = positionAttr.getY(i);
    const t = THREE.MathUtils.clamp((y + height / 2) / height, 0, 1);
    const base = i * 4;
    skinIndices[base + 0] = startIndex;
    skinIndices[base + 1] = endIndex;
    skinIndices[base + 2] = 0;
    skinIndices[base + 3] = 0;

    skinWeights[base + 0] = 1 - t;
    skinWeights[base + 1] = t;
    skinWeights[base + 2] = 0;
    skinWeights[base + 3] = 0;
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));

  // Align with the start->end vector and translate to midpoint.
  const up = new THREE.Vector3(0, 1, 0);
  const targetDir = length > 1e-5 ? direction.clone().normalize() : up.clone();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, targetDir);
  geometry.applyQuaternion(quaternion);

  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  geometry.translate(midpoint.x, midpoint.y, midpoint.z);
  geometry.name = name;

  return geometry;
}

function createAttachedSphere({ center, radius, boneIndex, name }) {
  const geometry = new THREE.SphereGeometry(radius, 18, 18);
  geometry.translate(center.x, center.y, center.z);
  geometry.name = name;

  const positionAttr = geometry.getAttribute("position");
  const vertexCount = positionAttr ? positionAttr.count : 0;
  const skinIndices = new Uint16Array(vertexCount * 4);
  const skinWeights = new Float32Array(vertexCount * 4);

  for (let i = 0; i < vertexCount; i += 1) {
    const base = i * 4;
    skinIndices[base + 0] = boneIndex;
    skinIndices[base + 1] = 0;
    skinIndices[base + 2] = 0;
    skinIndices[base + 3] = 0;
    skinWeights[base + 0] = 1.0;
    skinWeights[base + 1] = 0.0;
    skinWeights[base + 2] = 0.0;
    skinWeights[base + 3] = 0.0;
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  return geometry;
}

function createFlatQuad({
  root,
  size,
  normal,
  boneIndex,
  name,
}) {
  const geometry = new THREE.PlaneGeometry(size.x, size.y, 1, 1);
  geometry.lookAt(normal);
  geometry.translate(root.x, root.y, root.z);
  geometry.name = name;

  const positionAttr = geometry.getAttribute("position");
  const vertexCount = positionAttr ? positionAttr.count : 0;
  const skinIndices = new Uint16Array(vertexCount * 4);
  const skinWeights = new Float32Array(vertexCount * 4);

  for (let i = 0; i < vertexCount; i += 1) {
    const base = i * 4;
    skinIndices[base + 0] = boneIndex;
    skinWeights[base + 0] = 1.0;
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  return geometry;
}

/**
 * Generate a skinned elephant mesh from the live skeleton.
 */
export function generateElephantMesh(skeletonResult, options = {}) {
  const { bones, skeleton, bonesByName, root: skeletonRootGroup } = skeletonResult;
  skeletonRootGroup.updateWorldMatrix(true, true);
  bones.forEach((bone) => bone.updateMatrixWorld(true));

  const lowPoly = options.lowPoly === true;
  const skinMaterial = createElephantSkinMaterial({ flatShading: lowPoly });

  const boneIndexByName = new Map();
  bones.forEach((bone, index) => {
    boneIndexByName.set(bone.name, index);
  });

  const geometries = [];
  const sizes = ElephantDefinition.sizes || {};

  const spineChain = ElephantDefinition.chains.spine;
  for (let i = 0; i < spineChain.length - 1; i += 1) {
    const a = spineChain[i];
    const b = spineChain[i + 1];
    const start = getBoneWorldPosition(bonesByName, a);
    const end = getBoneWorldPosition(bonesByName, b);
    if (!start || !end) continue;
    const rA = averageSizeRadius(sizes[a], 0.9);
    const rB = averageSizeRadius(sizes[b], 0.9);
    const radius = Math.max(0.25, (rA + rB) * 0.5);
    const geom = createSkinnedCylinder({
      start,
      end,
      startIndex: boneIndexByName.get(a) ?? 0,
      endIndex: boneIndexByName.get(b) ?? 0,
      radius,
      radialSegments: lowPoly ? 10 : 18,
      name: `torso_${a}_${b}`,
    });
    geometries.push(geom);
  }

  const headCenter = getBoneWorldPosition(bonesByName, "head");
  if (headCenter) {
    const headRadius = averageSizeRadius(sizes.head, 0.85) * 0.9;
    const headGeom = createAttachedSphere({
      center: headCenter,
      radius: headRadius,
      boneIndex: boneIndexByName.get("head") ?? 0,
      name: "head_sphere",
    });
    geometries.push(headGeom);
  }

  const trunkChain = ElephantDefinition.chains.trunk;
  for (let i = 0; i < trunkChain.length - 1; i += 1) {
    const a = trunkChain[i];
    const b = trunkChain[i + 1];
    const start = getBoneWorldPosition(bonesByName, a);
    const end = getBoneWorldPosition(bonesByName, b);
    if (!start || !end) continue;
    const rA = averageSizeRadius(sizes[a], 0.2);
    const rB = averageSizeRadius(sizes[b], 0.2);
    const radius = Math.max(0.08, (rA + rB) * 0.5);
    const geom = createSkinnedCylinder({
      start,
      end,
      startIndex: boneIndexByName.get(a) ?? 0,
      endIndex: boneIndexByName.get(b) ?? 0,
      radius,
      radialSegments: lowPoly ? 6 : 12,
      name: `trunk_${a}_${b}`,
    });
    geometries.push(geom);
  }

  const tailChain = ElephantDefinition.chains.tail;
  for (let i = 0; i < tailChain.length - 1; i += 1) {
    const a = tailChain[i];
    const b = tailChain[i + 1];
    const start = getBoneWorldPosition(bonesByName, a);
    const end = getBoneWorldPosition(bonesByName, b);
    if (!start || !end) continue;
    const radius = Math.max(0.04, averageSizeRadius(sizes[a], 0.08));
    const geom = createSkinnedCylinder({
      start,
      end,
      startIndex: boneIndexByName.get(a) ?? 0,
      endIndex: boneIndexByName.get(b) ?? 0,
      radius,
      radialSegments: lowPoly ? 5 : 8,
      name: `tail_${a}_${b}`,
    });
    geometries.push(geom);
  }

  const tuskChains = [ElephantDefinition.chains.tuskLeft, ElephantDefinition.chains.tuskRight];
  tuskChains.forEach((chain, idx) => {
    for (let i = 0; i < chain.length - 1; i += 1) {
      const a = chain[i];
      const b = chain[i + 1];
      const start = getBoneWorldPosition(bonesByName, a);
      const end = getBoneWorldPosition(bonesByName, b);
      if (!start || !end) continue;
      const radius = Math.max(0.05, averageSizeRadius(sizes[a], 0.1));
      const geom = createSkinnedCylinder({
        start,
        end,
        startIndex: boneIndexByName.get(a) ?? 0,
        endIndex: boneIndexByName.get(b) ?? 0,
        radius,
        radialSegments: lowPoly ? 5 : 10,
        name: `tusk_${idx}_${a}_${b}`,
      });
      geometries.push(geom);
    }
  });

  const earLeftRoot = getBoneWorldPosition(bonesByName, "ear_left");
  if (earLeftRoot) {
    const earRadius = averageSizeRadius(sizes.ear_left, 0.6);
    const earGeom = createFlatQuad({
      root: earLeftRoot,
      size: new THREE.Vector2(earRadius * 1.6, earRadius * 1.2),
      normal: new THREE.Vector3(0, 0.1, -1),
      boneIndex: boneIndexByName.get("ear_left") ?? 0,
      name: "ear_left_quad",
    });
    geometries.push(earGeom);
  }

  const earRightRoot = getBoneWorldPosition(bonesByName, "ear_right");
  if (earRightRoot) {
    const earRadius = averageSizeRadius(sizes.ear_right, 0.6);
    const earGeom = createFlatQuad({
      root: earRightRoot,
      size: new THREE.Vector2(earRadius * 1.6, earRadius * 1.2),
      normal: new THREE.Vector3(0, 0.1, -1),
      boneIndex: boneIndexByName.get("ear_right") ?? 0,
      name: "ear_right_quad",
    });
    geometries.push(earGeom);
  }

  const legChains = [
    ElephantDefinition.chains.frontLegL,
    ElephantDefinition.chains.frontLegR,
    ElephantDefinition.chains.backLegL,
    ElephantDefinition.chains.backLegR,
  ];
  legChains.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i += 1) {
      const a = chain[i];
      const b = chain[i + 1];
      const start = getBoneWorldPosition(bonesByName, a);
      const end = getBoneWorldPosition(bonesByName, b);
      if (!start || !end) continue;
      const rA = averageSizeRadius(sizes[a], 0.35);
      const rB = averageSizeRadius(sizes[b], 0.35);
      const radius = Math.max(0.18, (rA + rB) * 0.5);
      const geom = createSkinnedCylinder({
        start,
        end,
        startIndex: boneIndexByName.get(a) ?? 0,
        endIndex: boneIndexByName.get(b) ?? 0,
        radius,
        radialSegments: lowPoly ? 7 : 12,
        name: `leg_${a}_${b}`,
      });
      geometries.push(geom);
    }
  });

  if (geometries.length === 0) {
    return { mesh: null };
  }

  const mergedGeometry = mergeGeometries(geometries, true);
  mergedGeometry.computeBoundingBox();
  mergedGeometry.computeBoundingSphere();

  const mesh = new THREE.SkinnedMesh(mergedGeometry, skinMaterial);
  mesh.name = `${ElephantDefinition.name}_SkinnedMesh`;
  mesh.add(skeletonRootGroup);
  mesh.bind(skeleton);

  return { mesh };
}

export default generateElephantMesh;
