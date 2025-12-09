import { buildCreatureFromBlueprint } from "./BlueprintCreatureRuntime.js";
// Import the V2 anatomy builder. This will be used when a blueprint
// defines `chainsV2` and `bodyPartsV2` arrays, signalling that it
// follows the generalised anatomy pipeline introduced in version 2.1.
import { buildCreatureFromBlueprintV2 } from "./CreatureRuntimeV2.js";

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
  const hasV2Chains = Array.isArray(blueprint?.chainsV2) && blueprint.chainsV2.length > 0;
  const hasV2Parts = Array.isArray(blueprint?.bodyPartsV2) && blueprint.bodyPartsV2.length > 0;
  const hasAnatomyBlock = Array.isArray(blueprint?.anatomy?.chains);
  const hasAnatomyParts = Array.isArray(blueprint?.anatomy?.bodyParts) || !!blueprint?.anatomy?.generators;
  const hasUnifiedAnatomy = (hasV2Chains && hasV2Parts) || (hasAnatomyBlock && hasAnatomyParts);
  const featureFlagV2 = options?.useAnatomyV2 ?? true;

  if (blueprint && hasUnifiedAnatomy && featureFlagV2) {
    return buildCreatureFromBlueprintV2(blueprint, options);
  }
  // Otherwise fall back to the legacy builder.
  return buildCreatureFromBlueprint(blueprint, options);
}

export { buildCreatureFromBlueprint };
