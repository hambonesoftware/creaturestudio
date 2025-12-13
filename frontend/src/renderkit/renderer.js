import * as THREE from "three";
import WebGPURenderer from "three/src/renderers/webgpu/WebGPURenderer.js";

export function isWebGPUSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

function buildWebGPURenderer({ size, antialias, alpha, canvas }) {
  const renderer = new WebGPURenderer({ antialias, alpha, canvas });

  // Keep color and shadow behavior aligned with the legacy WebGL path while
  // using WebGPU-only rendering.
  renderer.setPixelRatio(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  renderer.setSize(size.width, size.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;

  const initPromise = typeof renderer.init === "function" ? renderer.init() : Promise.resolve();

  return { renderer, rendererKind: "webgpu", initPromise };
}

/**
 * Factory that centralizes renderer creation so CreatureStudio and Zoo-style
 * apps can switch to WebGPU in one place. Phase 1 requires WebGPU-only;
 * if WebGPU is unavailable an error is thrown so the caller can present the
 * "WebGPU Required" overlay instead of silently falling back to WebGL.
 */
export function createRenderKitRenderer({
  size = { width: 800, height: 600 },
  preferWebGPU = true,
  antialias = true,
  alpha = true,
  canvas,
} = {}) {
  if (preferWebGPU && !isWebGPUSupported()) {
    throw new Error("[renderkit] WebGPU is required but navigator.gpu is not available in this environment.");
  }

  if (!preferWebGPU) {
    throw new Error("[renderkit] WebGPU-only renderer invoked with preferWebGPU=false; Zoo parity forbids WebGL fallback.");
  }

  return buildWebGPURenderer({ size, antialias, alpha, canvas });
}
