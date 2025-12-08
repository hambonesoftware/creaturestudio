import * as THREE from "three";
import { buildSkeletonFromBlueprint } from "./buildSkeletonFromBlueprint.js";
import { generateElephantMesh } from "../animals/Elephant/ElephantMeshGenerator.js";
import { createBehaviorControllerForBlueprint } from "../behavior/BehaviorRegistry.js";

/**
 * Build an elephant using the Zoo-style bodyParts pipeline.
 *
 * This bypasses the generic V2 anatomy runtime so that the elephant mesh is
 * constructed with the same ring-based generators and behaviour wiring as the
 * Zoo implementation. All other species continue to use the V2 path.
 */
export function buildElephantFromBodyParts(blueprint, options = {}) {
  if (!blueprint) {
    throw new Error("buildElephantFromBodyParts requires a SpeciesBlueprint");
  }

  const skeletonResult = buildSkeletonFromBlueprint(blueprint);

  // Geometry + material assembly using the bodyParts generators.
  const meshResult = generateElephantMesh(skeletonResult, options) || {};

  const creatureName = blueprint.meta?.name || blueprint.meta?.speciesName || "Elephant";
  const root = new THREE.Group();
  root.name = `${creatureName}_ElephantBodyPartsRoot`;

  if (meshResult.mesh) {
    root.add(meshResult.mesh);
  } else if (skeletonResult.root) {
    // Fall back to showing the skeleton if mesh generation failed.
    root.add(skeletonResult.root);
  }

  // Behaviour wiring mirrors the legacy runtime: use the registry so presets
  // like `elephant_default` resolve to StudioElephantBehavior.
  const controller = createBehaviorControllerForBlueprint(
    blueprint,
    skeletonResult.skeleton,
    meshResult.mesh,
    options
  );
  const update = controller && typeof controller.update === "function" ? controller.update.bind(controller) : null;

  return {
    type: "zoo-elephant",
    root,
    mesh: meshResult.mesh || null,
    mergedGeometry: meshResult.mergedGeometry || null,
    partGeometries: meshResult.partGeometries || [],
    skeleton: skeletonResult.skeleton,
    bones: skeletonResult.bones,
    bonesByName: skeletonResult.bonesByName,
    skeletonRoot: skeletonResult.skeletonRoot,
    skeletonRootGroup: skeletonResult.root,
    controller,
    update,
    meta: { pipeline: "zoo-elephant" },
  };
}

export default buildElephantFromBodyParts;
