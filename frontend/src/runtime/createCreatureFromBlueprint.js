import * as THREE from "three";
import { buildSkeletonFromBlueprint } from "./buildSkeletonFromBlueprint.js";
import { buildGeometryFromBlueprint } from "./buildGeometryFromBlueprint.js";
import { generateElephantMesh } from "../animals/Elephant/ElephantMeshGenerator.js";
import { StudioElephantBehavior } from "../animals/Elephant/StudioElephantBehavior.js";

function isElephantBlueprint(blueprint) {
  const name = blueprint?.meta?.name?.toLowerCase?.();
  const tags = blueprint?.behaviorPresets?.tags || blueprint?.meta?.tags;
  const lowered = Array.isArray(tags) ? tags.map((t) => `${t}`.toLowerCase()) : [];
  return name === "elephant" || lowered.includes("elephant");
}

function createElephantRuntime(blueprint, skeletonResult, options) {
  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Elephant";
  const { mesh } = generateElephantMesh(skeletonResult, options);

  const creatureRoot = new THREE.Group();
  creatureRoot.name = `${creatureName}_CreatureRoot`;
  if (mesh) {
    creatureRoot.add(mesh);
  }

  const behavior = new StudioElephantBehavior(skeletonResult.skeleton, mesh);

  return {
    root: creatureRoot,
    mesh,
    skeleton: skeletonResult.skeleton,
    bones: skeletonResult.bones,
    bonesByName: skeletonResult.bonesByName,
    skeletonRoot: skeletonResult.skeletonRoot,
    skeletonRootGroup: skeletonResult.root,
    behavior,
    update: (dt) => behavior.update(dt),
  };
}

/**
 * High-level runtime entry: create a creature from a SpeciesBlueprint.
 *
 * Returns:
 *   {
 *     root: THREE.Group,
 *     mesh: THREE.SkinnedMesh,
 *     skeleton: THREE.Skeleton,
 *     bones: THREE.Bone[],
 *     bonesByName: Map<string, THREE.Bone>,
 *   }
 */
export function createCreatureFromBlueprint(blueprint, options = {}) {
  const skeletonResult = buildSkeletonFromBlueprint(blueprint);
  const creatureName = blueprint.meta && blueprint.meta.name ? blueprint.meta.name : "Creature";

  if (isElephantBlueprint(blueprint)) {
    return createElephantRuntime(blueprint, skeletonResult, options);
  }

  const { mesh } = buildGeometryFromBlueprint(blueprint, skeletonResult, options);

  const creatureRoot = new THREE.Group();
  creatureRoot.name = `${creatureName}_CreatureRoot`;

  creatureRoot.add(mesh);

  return {
    root: creatureRoot,
    mesh,
    skeleton: skeletonResult.skeleton,
    bones: skeletonResult.bones,
    bonesByName: skeletonResult.bonesByName,
    skeletonRoot: skeletonResult.skeletonRoot,
    skeletonRootGroup: skeletonResult.root,
    update: null,
  };
}
