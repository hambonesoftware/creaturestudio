import * as THREE from "three";
import { createStandardMaterial } from "../../renderkit/materialUtils.js";
import { createElephantSkinMaterial } from "./ElephantSkinMaterial.js";

const DEFAULT_SURFACE_COLOR = new THREE.Color("#6b6a6a");
const DEFAULT_EYE_COLOR = new THREE.Color("#2a2a2a");
const DEFAULT_TUSK_COLOR = new THREE.Color("#f5ecd7");

export function createElephantSurfaceMaterial(intent = {}) {
  const color = intent.color ? new THREE.Color(intent.color) : DEFAULT_SURFACE_COLOR;
  return createStandardMaterial({
    color,
    roughness: typeof intent.roughness === "number" ? intent.roughness : 0.92,
    metalness: typeof intent.metallic === "number" ? intent.metallic : 0.025,
  });
}

export function createElephantEyeMaterial(intent = {}) {
  const color = intent.color ? new THREE.Color(intent.color) : DEFAULT_EYE_COLOR;
  return createStandardMaterial({
    color,
    roughness: typeof intent.roughness === "number" ? intent.roughness : 0.4,
    metalness: typeof intent.metallic === "number" ? intent.metallic : 0.02,
  });
}

export function createElephantTuskMaterial(intent = {}) {
  const color = intent.color ? new THREE.Color(intent.color) : DEFAULT_TUSK_COLOR;
  return createStandardMaterial({
    color,
    roughness: typeof intent.roughness === "number" ? intent.roughness : 0.5,
    metalness: typeof intent.metallic === "number" ? intent.metallic : 0.03,
  });
}

export function resolveElephantMaterials(materialsIntent = {}) {
  return {
    surface: createElephantSurfaceMaterial(materialsIntent.surface || {}),
    eye: createElephantEyeMaterial(materialsIntent.eye || {}),
    tusk: createElephantTuskMaterial(materialsIntent.tusk || {}),
  };
}

export default resolveElephantMaterials;
