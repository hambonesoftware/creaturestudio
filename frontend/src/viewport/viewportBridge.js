import * as THREE from "three";
import { createCreatureFromBlueprint } from "../runtime/createCreatureFromBlueprint.js";
import { CreatureViewport } from "./CreatureViewport.js";
import { getState } from "../studioState.js";

/**
 * Module-level singleton viewport used by the layout and panels.
 */
let viewportInstance = null;
let viewportContainerElement = null;

function getContainerSize() {
  if (!viewportContainerElement) {
    return { width: 800, height: 600 };
  }
  const rect = viewportContainerElement.getBoundingClientRect();
  const width = rect.width || viewportContainerElement.clientWidth || 800;
  const height = rect.height || viewportContainerElement.clientHeight || 600;
  return { width, height };
}

/**
 * Initialize the singleton CreatureViewport attached to the given container.
 */
export function initCreatureViewport(containerElement) {
  if (!containerElement) {
    throw new Error("[viewportBridge] initCreatureViewport requires a container element");
  }

  if (!viewportInstance) {
    viewportContainerElement = containerElement;
    viewportInstance = new CreatureViewport(containerElement);

    const { width, height } = getContainerSize();
    viewportInstance.setSize(width, height);
    viewportInstance.start();

    window.addEventListener("resize", handleWindowResize);
  }

  return viewportInstance;
}

function handleWindowResize() {
  if (!viewportInstance) {
    return;
  }
  const { width, height } = getContainerSize();
  viewportInstance.setSize(width, height);
}

/**
 * Dispose the viewport singleton and detach listeners.
 */
export function disposeCreatureViewport() {
  if (!viewportInstance) {
    return;
  }

  window.removeEventListener("resize", handleWindowResize);

  viewportInstance.dispose();
  viewportInstance = null;
  viewportContainerElement = null;
}

export function setViewportLighting(mode) {
  if (!viewportInstance || typeof viewportInstance.setLightingMode !== "function") {
    return;
  }

  viewportInstance.setLightingMode(mode);
}

/**
 * Convert a blueprint into a Three.js creature root group and display it.
 *
 * This helper is used by:
 * - Initial bootstrap when a blueprint is first loaded.
 * - Species selection changes.
 * - The "Update Preview" button in the inspector.
 */
export function updateViewportFromBlueprint(blueprint) {
  if (!viewportInstance || !blueprint) {
    return;
  }

  const runtime = createCreatureFromBlueprint(blueprint);

  const { viewportMode = "mesh" } = getState();
  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Creature";

  const displayRoot = new THREE.Group();
  displayRoot.name = `${creatureName}_DisplayRoot`;

  // Optional global scale hook. If the blueprint defines sizes.globalScale,
  // respect it by scaling the creature root uniformly.
  const sizes = blueprint.sizes || {};
  const globalScale =
    typeof sizes.globalScale === "number" && Number.isFinite(sizes.globalScale)
      ? sizes.globalScale
      : 1.0;

  const helperTarget =
    runtime.skeletonRoot || runtime.skeletonRootGroup || runtime.mesh || runtime.root;
  let skeletonHelper = null;

  if ((viewportMode === "skeleton" || viewportMode === "both") && helperTarget) {
    skeletonHelper = new THREE.SkeletonHelper(helperTarget);
    skeletonHelper.name = `${creatureName}_SkeletonHelper`;
    if (skeletonHelper.material) {
      skeletonHelper.material.depthTest = false;
      skeletonHelper.material.transparent = true;
      skeletonHelper.material.opacity = 0.9;
    }
  }

  if (runtime.mesh) {
    runtime.mesh.visible = viewportMode === "mesh" || viewportMode === "both";
  }

  if (runtime.root) {
    displayRoot.add(runtime.root);
  }

  if (skeletonHelper) {
    displayRoot.add(skeletonHelper);
  }

  if (globalScale !== 1.0) {
    displayRoot.scale.set(globalScale, globalScale, globalScale);
  }

  runtime.displayRoot = displayRoot;
  runtime.skeletonHelper = skeletonHelper;

  viewportInstance.setRuntime(runtime);
}
