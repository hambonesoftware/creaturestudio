import * as THREE from "three";
import MeshStandardNodeMaterial from "three/src/materials/nodes/MeshStandardNodeMaterial.js";

function normalizeColor(value) {
  if (typeof value === "string") {
    try {
      return new THREE.Color(value);
    } catch (_err) {
      return value;
    }
  }
  return value;
}

export function createStandardMaterial(params = {}) {
  const materialParams = { ...params };
  materialParams.color = normalizeColor(materialParams.color);
  materialParams.emissive = normalizeColor(materialParams.emissive);
  return new MeshStandardNodeMaterial(materialParams);
}
