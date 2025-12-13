import * as THREE from "three";
import {
  createOrbitCamera,
  createOrbitControls,
  createGroundPlane,
  createLightingRig,
  createRenderKitRenderer,
  ensureWebGPUOverlay,
  removeWebGPUOverlay,
  isWebGPUSupported,
  disposeLightingRig,
  resizeCamera,
} from "../renderkit/index.js";

/**
 * CreatureViewport
 *
 * Thin wrapper around a Three.js scene + camera + renderer that knows how to:
 * - Attach to a DOM container.
 * - Maintain a single creature root group in the scene.
 * - Resize with the container.
 * - Render continuously using requestAnimationFrame.
 *
 * This module does not know anything about blueprints or runtime logic.
 * Higher-level helpers (viewportBridge, runtime, etc.) are responsible for
 * building a THREE.Group for the creature and calling setCreature(rootGroup).
 */
class CreatureViewport {
  /**
   * @param {HTMLElement} containerElement - DOM element to attach the viewport's canvas into.
   */
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error("[CreatureViewport] containerElement is required");
    }

    this.container = containerElement;
    this.webgpuOverlay = null;

    // Core Three.js objects
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050509);

    // Determine initial size from container
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || this.container.clientWidth || 800;
    const height = rect.height || this.container.clientHeight || 600;

    // Camera setup (shared via render kit)
    this.camera = createOrbitCamera({
      aspect: width / height,
    });

    this.renderer = null;
    this.rendererReadyPromise = null;

    // Renderer setup (WebGPU only for Zoo parity)
    if (!isWebGPUSupported()) {
      this.webgpuOverlay = ensureWebGPUOverlay(
        this.container,
        "WebGPU is required for CreatureStudio. Please use a browser and GPU stack with navigator.gpu enabled."
      );
    } else {
      try {
        const { renderer, initPromise } = createRenderKitRenderer({
          size: { width, height },
          preferWebGPU: true,
        });
        this.renderer = renderer;
        this.rendererReadyPromise = initPromise || Promise.resolve();
        removeWebGPUOverlay(this.container);
      } catch (error) {
        console.error("[CreatureViewport] Failed to create WebGPU renderer", error);
        this.webgpuOverlay = ensureWebGPUOverlay(
          this.container,
          "WebGPU is required to render this viewport. Renderer creation failed."
        );
      }
    }

    // Remove any existing canvas in the container (defensive)
    const existingCanvas = this.container.querySelector("canvas");
    if (existingCanvas && existingCanvas.parentNode === this.container) {
      this.container.removeChild(existingCanvas);
    }

    // Attach the renderer canvas
    if (this.renderer && this.renderer.domElement) {
      this.container.appendChild(this.renderer.domElement);
    }

    // Camera controls
    this.controls = this.renderer ? createOrbitControls(this.camera, this.renderer.domElement) : null;

    // Lights + ground
    this.lightingMode = "allAround";
    this.lightingGroup = null;
    this.ground = null;
    this._setupLights(this.lightingMode);
    this._setupGround();

    // Currently displayed creature root group (if any).
    this.creatureRoot = null;
    this._activeRuntime = null;
    this._lastFrameTime = null;

    // Animation loop bookkeeping.
    this._running = false;
    this._boundAnimate = this._animate.bind(this);
  }

  /**
   * Basic lighting: soft ambient + key rim light + fill.
   * No JSX, just Three.js objects.
   */
  _setupLights(mode = "allAround") {
    if (this.lightingGroup) {
      this._teardownLights();
    }

    const group = createLightingRig(mode);

    this.scene.add(group);
    this.lightingGroup = group;
    this.lightingMode = mode;
  }

  _teardownLights() {
    if (!this.lightingGroup) return;

    disposeLightingRig(this.lightingGroup);
    this.scene.remove(this.lightingGroup);
    this.lightingGroup = null;
  }

  setLightingMode(mode) {
    const normalized = mode === "studio" ? "studio" : "allAround";
    if (this.lightingMode === normalized) {
      return;
    }
    this._setupLights(normalized);
  }

  /**
   * Simple ground plane so the creature does not float in space.
   */
  _setupGround() {
    if (this.ground) {
      return;
    }
    this.ground = createGroundPlane();
    this.scene.add(this.ground);
  }

  _teardownGround() {
    if (!this.ground) {
      return;
    }

    this.scene.remove(this.ground);
    if (this.ground.geometry && typeof this.ground.geometry.dispose === "function") {
      this.ground.geometry.dispose();
    }
    if (this.ground.material && typeof this.ground.material.dispose === "function") {
      this.ground.material.dispose();
    }
    this.ground = null;
  }

  /**
   * Update renderer and camera aspect to match the given size.
   * Called from viewportBridge.resizeViewportToContainer().
   *
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    const safeWidth = Math.max(1, width | 0);
    const safeHeight = Math.max(1, height | 0);

    resizeCamera(this.camera, safeWidth, safeHeight);

    if (this.renderer) {
      this.renderer.setSize(safeWidth, safeHeight);
    }
  }

  /**
   * Replace the currently displayed creature with the given root THREE.Group.
   *
   * @param {THREE.Group | null} rootGroup
   */
  setCreature(rootGroup) {
    // Remove existing creature if present
    if (this.creatureRoot && this.creatureRoot.parent === this.scene) {
      this.scene.remove(this.creatureRoot);
    }

    this.creatureRoot = null;

    if (!rootGroup) {
      return;
    }

    // Center the creature roughly at the origin for now.
    rootGroup.position.set(0, 0, 0);

    this.scene.add(rootGroup);
    this.creatureRoot = rootGroup;
  }

  /**
   * Convenience helper that also stores the runtime update hook.
   */
  setRuntime(runtimeResult) {
    this._activeRuntime = runtimeResult || null;
    this._lastFrameTime = null;
    const wantsNoLights = runtimeResult?.disableDefaultLighting === true;
    const wantsNoGround = runtimeResult?.disableDefaultGround === true;

    if (wantsNoLights) {
      this._teardownLights();
    } else if (!this.lightingGroup) {
      this._setupLights(this.lightingMode);
    }

    if (wantsNoGround) {
      this._teardownGround();
    } else if (!this.ground) {
      this._setupGround();
    }

    const rootGroup = runtimeResult ? runtimeResult.displayRoot || runtimeResult.root : null;
    this.setCreature(rootGroup);
  }

  /**
   * Begin the animation loop.
   */
  start() {
    if (this._running) {
      return;
    }

    if (!this.renderer) {
      this.webgpuOverlay = ensureWebGPUOverlay(
        this.container,
        "WebGPU is required to render this viewport."
      );
      return;
    }

    this._running = true;

    const kickoff = this.rendererReadyPromise || Promise.resolve();
    kickoff
      .catch((error) => {
        console.error("[CreatureViewport] WebGPU renderer failed to initialize", error);
        this.webgpuOverlay = ensureWebGPUOverlay(
          this.container,
          "WebGPU renderer failed to initialize. Please check browser support."
        );
        this._running = false;
      })
      .then(() => {
        if (!this._running) {
          return;
        }
        this._scheduleNextFrame();
      });
  }

  /**
   * Stop the animation loop.
   */
  stop() {
    this._running = false;
    this._lastFrameTime = null;
  }

  _scheduleNextFrame() {
    if (!this._running) {
      return;
    }
    window.requestAnimationFrame(this._boundAnimate);
  }

  _animate(timestamp) {
    if (!this._running) {
      return;
    }

    if (!this.renderer) {
      this._running = false;
      return;
    }

    const dt = this._lastFrameTime === null ? 0 : (timestamp - this._lastFrameTime) / 1000;
    this._lastFrameTime = timestamp;

    if (this._activeRuntime && typeof this._activeRuntime.update === "function") {
      this._activeRuntime.update(dt);
    }
    if (
      this._activeRuntime &&
      this._activeRuntime.skeletonHelper &&
      typeof this._activeRuntime.skeletonHelper.update === "function"
    ) {
      this._activeRuntime.skeletonHelper.update();
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
    this._scheduleNextFrame();
  }

  /**
   * Clean up renderer resources and detach from the DOM.
   * Called from viewportBridge.disposeCreatureViewport().
   */
  dispose() {
    this.stop();

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.creatureRoot && this.creatureRoot.parent === this.scene) {
      this.scene.remove(this.creatureRoot);
    }
    this.creatureRoot = null;

    this._teardownGround();
    this._teardownLights();

    // Dispose geometries and materials for all meshes.
    this.scene.traverse((obj) => {
      if (!obj.isMesh) {
        return;
      }

      if (obj.geometry) {
        obj.geometry.dispose();
      }

      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
            if (m && typeof m.dispose === "function") {
              m.dispose();
            }
          });
        } else if (typeof obj.material.dispose === "function") {
          obj.material.dispose();
        }
      }
    });

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Remove canvas from DOM
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.renderer = null;
    this.rendererReadyPromise = null;

    removeWebGPUOverlay(this.container);
  }
}

export { CreatureViewport };
