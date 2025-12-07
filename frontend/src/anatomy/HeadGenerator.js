import * as THREE from "three";
import { normalizeGeneratorParams, resolveChainPositions } from "./utils.js";

export function generateHeadGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    parentBone = "head",
    radius = 0.6,
    elongation = 1.0,
    detail = 0,
    partName = "head",
  } = options;

  const chainPositions = resolveChainPositions({
    skeleton,
    bones: bones.length > 0 ? bones : [parentBone],
    chainBones,
    chainWorldPositions,
  });

  const center = chainPositions.length > 0 ? chainPositions[chainPositions.length - 1] : new THREE.Vector3();

  let geometry = new THREE.IcosahedronGeometry(1.0, detail);
  geometry.scale(1.2 * radius, 1.0 * radius, (radius * elongation) / 2);

  if (chainPositions.length > 1) {
    const neckPos = chainPositions[chainPositions.length - 2];
    const dir = center.clone().sub(neckPos).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    geometry.applyQuaternion(quat);
  }

  geometry.translate(center.x, center.y, center.z);

  if (geometry.index) {
    geometry = geometry.toNonIndexed();
  }

  const vertexCount = geometry.getAttribute("position").count;
  const indices = new Uint16Array(vertexCount * 4);
  const weights = new Float32Array(vertexCount * 4);

  const headBoneIndex = skeleton?.bones
    ? skeleton.bones.findIndex((bone) => bone.name === parentBone)
    : 0;

  for (let i = 0; i < vertexCount; i += 1) {
    indices[i * 4] = headBoneIndex >= 0 ? headBoneIndex : 0;
    weights[i * 4] = 1;
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeVertexNormals();
  geometry.name = `${partName}_Head`;
  return geometry;
}
