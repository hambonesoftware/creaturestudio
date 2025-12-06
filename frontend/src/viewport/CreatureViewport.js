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
    this._setupLights();
    this._setupGround();

    // Currently displayed creature root group (if any).
    this.creatureRoot = null;

    // Animation loop bookkeeping.
    this._running = false;
    this._boundAnimate = this._animate.bind(this);
  }

  /**
   * Basic lighting: soft ambient + key rim light + fill.
   * No JSX, just Three.js objects.
   */
  _setupLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x202030, 0.6);
    hemi.position.set(0, 4, 0);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-4, 6, -6);
    this.scene.add(fillLight);
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
  }

  _scheduleNextFrame() {
    if (!this._running) {
      return;
    }
    window.requestAnimationFrame(this._boundAnimate);
  }

  _animate() {
    if (!this._running) {
      return;
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
