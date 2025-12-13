import * as THREE from "three";

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(6, 4, 8);
const DEFAULT_CAMERA_LOOK_AT = new THREE.Vector3(0, 1, 0);

/**
 * Create a reusable perspective camera configured for creature viewing.
 */
export function createOrbitCamera({ fov = 45, aspect = 4 / 3, near = 0.1, far = 300, position = DEFAULT_CAMERA_POSITION } = {}) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.copy(position);
  camera.lookAt(DEFAULT_CAMERA_LOOK_AT);
  return camera;
}

/**
 * Update a camera's aspect ratio and projection when the viewport is resized.
 */
export function resizeCamera(camera, width, height) {
  if (!camera || typeof camera.updateProjectionMatrix !== "function") return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
