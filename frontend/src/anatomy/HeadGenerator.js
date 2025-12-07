import * as THREE from "three";
import {
  normalizeGeneratorParams,
  resolveBoneNames,
  resolveChainPositions,
} from "./utils.js";

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
    sides = 22,
    elongation = 1.0,
    partName = "head",
  } = options;

  const points = resolveChainPositions({
    skeleton,
    bones: bones.length > 0 ? bones : [parentBone],
    chainBones,
    chainWorldPositions,
  });

  const center = points.length > 0 ? points[points.length - 1] : new THREE.Vector3();

  const geometry = new THREE.SphereGeometry(radius, Math.max(6, sides), Math.max(6, sides));
  geometry.scale(1, 1, elongation);
  geometry.translate(center.x, center.y, center.z);

  const vertexCount = geometry.getAttribute("position").count;
  const indices = new Uint16Array(vertexCount * 4);
  const weights = new Float32Array(vertexCount * 4);

  const boneNames = resolveBoneNames({ bones: bones.length > 0 ? bones : [parentBone], chainBones });
  const headBoneIndex = Math.max(0, boneNames.indexOf(parentBone));
  for (let i = 0; i < vertexCount; i += 1) {
    indices[i * 4] = headBoneIndex;
    weights[i * 4] = 1;
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeVertexNormals();
  geometry.name = `${partName}_Head`;
  return geometry;
}
