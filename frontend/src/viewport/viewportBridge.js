import * as THREE from "three";
// Import the unified creature creation helper. This wrapper chooses
// between the legacy and V2 builders based on the blueprint contents.
import { createCreatureFromBlueprint } from "../runtime/createCreatureFromBlueprint.js";
import { CreatureViewport } from "./CreatureViewport.js";
import { getState, setError } from "../studioState.js";
import { BlueprintCompiler } from "../animals/blueprint/BlueprintCompiler.js";
import { createZooParityRegistry } from "../animals/registry/index.js";

/**
 * Module-level singleton viewport used by the layout and panels.
 */
let viewportInstance = null;
let viewportContainerElement = null;
let compilerInstance = null;
let animalRegistryInstance = null;

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

export function getAnimalRegistry() {
  if (!animalRegistryInstance) {
    animalRegistryInstance = createZooParityRegistry();
  }
  return animalRegistryInstance;
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

  if (!compilerInstance) {
    compilerInstance = new BlueprintCompiler();
  }

  let runtimeBlueprint = blueprint;
  let compiledSpecies = null;

  try {
    compiledSpecies = compilerInstance.compile(blueprint);
    runtimeBlueprint = compiledSpecies.runtime.blueprint;
    if (compiledSpecies.validation?.warnings?.length) {
      console.info("[BlueprintCompiler] Validation warnings:", compiledSpecies.validation.warnings);
    }
    setError(null);
  } catch (error) {
    console.error("[viewportBridge] Blueprint compile failed", error);
    setError(error?.message || "Blueprint compile failed");
    viewportInstance.setRuntime(null);
    return;
  }

  const state = getState();
  let runtime = null;
  try {
    // Build the creature using the unified creation helper. This will
    // automatically select the V2 pipeline when available.
    runtime = createCreatureFromBlueprint(runtimeBlueprint, {
      isolatePart: state.debugIsolatePart || undefined,
    });
  } catch (error) {
    console.error("[viewportBridge] Runtime build failed", error);
    setError(error?.message || "Failed to build creature runtime");
    viewportInstance.setRuntime(null);
    return;
  }

  if (compiledSpecies) {
    runtime.compiledSpecies = compiledSpecies;
  }

  const { viewportMode = "mesh" } = state;
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
  let debugGroup = null;

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

  runtime.skeletonRootGroup?.updateWorldMatrix(true, true);

  if (state.debugShowBones && runtime.bones) {
    debugGroup = debugGroup || new THREE.Group();
    debugGroup.name = `${creatureName}_Debug`;
    for (const bone of runtime.bones) {
      if (!bone || !bone.parent || !bone.parent.isBone) continue;
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();
      bone.parent.getWorldPosition(start);
      bone.getWorldPosition(end);
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({ color: 0x44ccff, transparent: true, opacity: 0.9 });
      const line = new THREE.Line(geometry, material);
      debugGroup.add(line);
    }
  }

  if (state.debugChainName) {
    let chainBones = [];
    // Support legacy blueprint chains (object maps) and extraChains.
    if (
      blueprint.chains &&
      (blueprint.chains[state.debugChainName] ||
        (blueprint.chains.extraChains && blueprint.chains.extraChains[state.debugChainName]))
    ) {
      chainBones = blueprint.chains[state.debugChainName] || blueprint.chains.extraChains[state.debugChainName] || [];
    } else if (Array.isArray(blueprint.chainsV2)) {
      // Look up the chain definition in V2 blueprints.
      const cd = blueprint.chainsV2.find((c) => c && c.name === state.debugChainName);
      if (cd && Array.isArray(cd.bones)) {
        chainBones = cd.bones;
      }
    }
    if (Array.isArray(chainBones) && chainBones.length > 0) {
      const points = [];
      for (const name of chainBones) {
        const bone = runtime.bonesByName?.get(name);
        if (!bone) continue;
        const pos = new THREE.Vector3();
        bone.getWorldPosition(pos);
        points.push(pos);
      }
      if (points.length > 1) {
        debugGroup = debugGroup || new THREE.Group();
        const chainGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const chainMaterial = new THREE.LineDashedMaterial({
          color: 0xffaa33,
          linewidth: 2,
          dashSize: 0.25,
          gapSize: 0.1,
        });
        const chainLine = new THREE.Line(chainGeometry, chainMaterial);
        chainLine.computeLineDistances();
        chainLine.name = `${creatureName}_ChainHighlight_${state.debugChainName}`;
        debugGroup.add(chainLine);
      }
    }
  }

  if (debugGroup) {
    displayRoot.add(debugGroup);
    runtime.debugGroup = debugGroup;
  }

  if (globalScale !== 1.0) {
    displayRoot.scale.set(globalScale, globalScale, globalScale);
  }

  runtime.displayRoot = displayRoot;
  runtime.skeletonHelper = skeletonHelper;

  viewportInstance.setRuntime(runtime);
  setError(null);
}

export async function loadAnimalPen(animalKey) {
  if (!viewportInstance) {
    return null;
  }

  const registry = getAnimalRegistry();
  const penRuntime = await registry.createPen(animalKey);

  if (!penRuntime) {
    return null;
  }

  viewportInstance.setRuntime(penRuntime);
  return penRuntime;
}
