import * as THREE from "three";

export function isWebGPUSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

function buildWebGLRenderer({ size, antialias, alpha }) {
  const renderer = new THREE.WebGLRenderer({ antialias, alpha });
  renderer.setPixelRatio(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  renderer.setSize(size.width, size.height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return { renderer, rendererKind: "webgl" };
}

/**
 * Factory that centralizes renderer creation so CreatureStudio and Zoo-style
 * apps can switch to WebGPU in one place. For now we default to WebGL but
 * surface detection data that callers can use to gate overlays or warnings.
 */
export function createRenderKitRenderer({ size = { width: 800, height: 600 }, preferWebGPU = true, antialias = true, alpha = true } = {}) {
  const wantsWebGPU = preferWebGPU && isWebGPUSupported();

  // WebGPU renderer wiring stays in one place for easy future enablement.
  // eslint-disable-next-line no-unused-vars
  if (wantsWebGPU) {
    // Placeholder seam: once WebGPURenderer is enabled, wire it here and
    // keep the signature intact so dependents stay stable.
  }

  return buildWebGLRenderer({ size, antialias, alpha });
}
