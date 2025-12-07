import { buildCreatureFromBlueprint } from "./BlueprintCreatureRuntime.js";

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
  return buildCreatureFromBlueprint(blueprint, options);
}

export { buildCreatureFromBlueprint };
