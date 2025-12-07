import * as THREE from "three";
import { generateLimbGeometry } from "./LimbGenerator.js";
import { normalizeGeneratorParams } from "./utils.js";

export function generateEarGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    flatten = 0.2,
    tilt = 0,
    partName = "ear",
  } = options;

  const limb = generateLimbGeometry(options);
  if (!limb || !limb.isBufferGeometry) {
    return limb;
  }

  const matrix = new THREE.Matrix4();
  const scale = new THREE.Matrix4().makeScale(1, 1, flatten);
  const rotation = new THREE.Matrix4().makeRotationZ(tilt);
  matrix.multiply(rotation).multiply(scale);

  limb.applyMatrix4(matrix);
  limb.computeVertexNormals();
  limb.name = `${partName}_Ear`;
  return limb;
}
