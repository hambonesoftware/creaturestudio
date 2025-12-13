import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

const DEFAULT_TARGET = new THREE.Vector3(0, 1, 0);

export function createOrbitControls(camera, domElement, options = {}) {
  const controls = new OrbitControls(camera, domElement);
  controls.target.copy(options.target || DEFAULT_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = typeof options.dampingFactor === "number" ? options.dampingFactor : 0.08;
  controls.enablePan = options.enablePan !== false;
  controls.minDistance = typeof options.minDistance === "number" ? options.minDistance : 2;
  controls.maxDistance = typeof options.maxDistance === "number" ? options.maxDistance : 90;
  controls.update();
  return controls;
}
