import * as THREE from "three";
import { buildSkeletonFromBlueprint } from "./buildSkeletonFromBlueprint.js";
import { buildGeometryFromBlueprint } from "./buildGeometryFromBlueprint.js";
import { createBehaviorControllerForBlueprint } from "../behavior/BehaviorRegistry.js";

/**
 * Runtime options accepted by buildCreatureFromBlueprint.
 * - lowPoly: forward a hint to generators to use simplified meshes where supported.
 * - variantSeed: reserved for future randomized variants.
 */
export function buildCreatureFromBlueprint(blueprint, options = {}) {
  if (!blueprint) {
    throw new Error("buildCreatureFromBlueprint requires a SpeciesBlueprint");
  }

  const skeletonResult = buildSkeletonFromBlueprint(blueprint);
  const geometryResult = buildGeometryFromBlueprint(blueprint, skeletonResult, options);

  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Creature";
  const root = new THREE.Group();
  root.name = `${creatureName}_CreatureRoot`;

  if (geometryResult.mesh) {
    root.add(geometryResult.mesh);
  }

  const controller = createBehaviorControllerForBlueprint(
    blueprint,
    skeletonResult.skeleton,
    geometryResult.mesh
  );
  const update = controller && typeof controller.update === "function" ? controller.update.bind(controller) : null;

  return {
    root,
    mesh: geometryResult.mesh,
    mergedGeometry: geometryResult.mergedGeometry,
    partGeometries: geometryResult.partGeometries,
    skeleton: skeletonResult.skeleton,
    bones: skeletonResult.bones,
    bonesByName: skeletonResult.bonesByName,
    skeletonRoot: skeletonResult.skeletonRoot,
    skeletonRootGroup: skeletonResult.root,
    controller,
    update,
  };
}
