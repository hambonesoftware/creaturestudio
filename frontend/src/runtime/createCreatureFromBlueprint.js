import * as THREE from "three";
import { buildSkeletonFromBlueprint } from "./buildSkeletonFromBlueprint.js";
import { buildGeometryFromBlueprint } from "./buildGeometryFromBlueprint.js";

/**
 * High-level runtime entry: create a creature from a SpeciesBlueprint.
 *
 * Returns:
 *   {
 *     root: THREE.Group,
 *     mesh: THREE.SkinnedMesh,
 *     skeleton: THREE.Skeleton,
 *     bones: THREE.Bone[],
 *   }
 */
export function createCreatureFromBlueprint(blueprint, options = {}) {
  const skeletonResult = buildSkeletonFromBlueprint(blueprint);
  const { root: skeletonRootGroup, bones, skeleton, skeletonRoot } = skeletonResult;

  const { mesh } = buildGeometryFromBlueprint(blueprint, skeletonResult, options);

  const creatureRoot = new THREE.Group();
  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Creature";
  creatureRoot.name = `${creatureName}_CreatureRoot`;

  creatureRoot.add(mesh);

  return {
    root: creatureRoot,
    mesh,
    skeleton,
    bones,
    skeletonRoot,
    skeletonRootGroup,
  };
}
