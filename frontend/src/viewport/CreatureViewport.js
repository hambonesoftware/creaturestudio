import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

    // Core Three.js objects
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050509);

    // Determine initial size from container
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || this.container.clientWidth || 800;
    const height = rect.height || this.container.clientHeight || 600;
    const aspect = width / height;

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 300);
    this.camera.position.set(6, 4, 8);
    this.camera.lookAt(0, 1, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Remove any existing canvas in the container (defensive)
    const existingCanvas = this.container.querySelector("canvas");
    if (existingCanvas && existingCanvas.parentNode === this.container) {
      this.container.removeChild(existingCanvas);
    }

    // Attach the renderer canvas
    this.container.appendChild(this.renderer.domElement);

    // Camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 90;
    this.controls.update();

    // Lights + ground
    this.lightingMode = "allAround";
    this.lightingGroup = null;
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

    const group = new THREE.Group();
    group.name = `Lighting_${mode}`;

    if (mode === "studio") {
      this._buildStudioLighting(group);
    } else {
      this._buildAllAroundLighting(group);
    }

    this.scene.add(group);
    this.lightingGroup = group;
    this.lightingMode = mode;
  }

  _teardownLights() {
    if (!this.lightingGroup) return;

    this.lightingGroup.traverse((obj) => {
      if (obj.isLight && obj.shadow && obj.shadow.map) {
        obj.shadow.map.dispose();
      }
    });

    this.scene.remove(this.lightingGroup);
    this.lightingGroup = null;
  }

  _buildStudioLighting(group) {
    const keySpot = new THREE.SpotLight(0xffffff, 1.4, 40, Math.PI / 4.5, 0.4, 1);
    keySpot.position.set(8, 10, 7);
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.set(2048, 2048);
    keySpot.target.position.set(0, 1, 0);
    group.add(keySpot);
    group.add(keySpot.target);

    const fillSpot = new THREE.SpotLight(0xffffff, 1.0, 35, Math.PI / 4.2, 0.5, 1);
    fillSpot.position.set(-8, 9, 5);
    fillSpot.castShadow = true;
    fillSpot.shadow.mapSize.set(1024, 1024);
    fillSpot.target.position.set(0, 1, 0);
    group.add(fillSpot);
    group.add(fillSpot.target);

    const rimSpot = new THREE.SpotLight(0xbcd8ff, 0.8, 45, Math.PI / 3.8, 0.35, 1);
    rimSpot.position.set(0, 11, -9);
    rimSpot.castShadow = true;
    rimSpot.shadow.mapSize.set(1024, 1024);
    rimSpot.target.position.set(0, 1, 0);
    group.add(rimSpot);
    group.add(rimSpot.target);
  }

  _buildAllAroundLighting(group) {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1f2635, 1.1);
    hemi.position.set(0, 6, 0);
    group.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    group.add(ambient);

    const north = new THREE.DirectionalLight(0xf0f6ff, 0.55);
    north.position.set(0, 10, 6);
    north.castShadow = true;
    north.shadow.mapSize.set(1024, 1024);
    group.add(north);

    const west = new THREE.DirectionalLight(0xf0f6ff, 0.45);
    west.position.set(-6, 8, -4);
    group.add(west);

    const east = new THREE.DirectionalLight(0xf0f6ff, 0.35);
    east.position.set(6, 8, -4);
    group.add(east);
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
    const groundRadius = 6;
    const geometry = new THREE.CircleGeometry(groundRadius, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x11121b,
      roughness: 0.9,
      metalness: 0.0,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;

    this.scene.add(ground);
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

    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(safeWidth, safeHeight);
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
    this._running = true;
    this._scheduleNextFrame();
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
   * Clean up WebGL resources and detach from the DOM.
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
  }
}

export { CreatureViewport };
