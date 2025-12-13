import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createStandardMaterial } from "../renderkit/materialUtils.js";

import { createRenderKitRenderer, isWebGPUSupported } from "../renderkit/renderer.js";
import { createCreatureFromBlueprint } from "../runtime/createCreatureFromBlueprint.js";
import ElephantBlueprint from "../blueprints/ElephantBlueprint.json";

/**
 * Debug entry point that renders a static elephant built from ElephantBlueprint.json.
 */
async function main() {
  const canvas = document.getElementById("creature-canvas");
  if (!canvas) {
    throw new Error("Missing <canvas id=\"creature-canvas\"> element.");
  }

  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is required for debugPreviewElephant; navigator.gpu is missing.");
  }

  const { renderer, initPromise } = createRenderKitRenderer({
    size: { width: window.innerWidth, height: window.innerHeight },
    antialias: true,
    alpha: false,
    canvas,
  });

  await initPromise;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 4, 8);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.update();

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 4);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const groundGeometry = new THREE.PlaneGeometry(40, 40);
  groundGeometry.rotateX(-Math.PI / 2);
  const groundMaterial = createStandardMaterial({
    color: 0x303030,
    roughness: 1.0,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  scene.add(ground);

  const { root } = createCreatureFromBlueprint(ElephantBlueprint, { useAnatomyV2: true });
  root.traverse((obj) => {
    if (obj.isMesh || obj.isSkinnedMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(root);

  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", onWindowResize);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    main();
  });
} else {
  main();
}
