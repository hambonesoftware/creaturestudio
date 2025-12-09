import { buildCreatureFromBlueprint } from "./BlueprintCreatureRuntime.js";
// Import the V2 anatomy builder. This will be used when a blueprint
// defines `chainsV2` and `bodyPartsV2` arrays, signalling that it
// follows the generalised anatomy pipeline introduced in version 2.1.
import { buildCreatureFromBlueprintV2 } from "./CreatureRuntimeV2.js";
import { buildElephantFromBodyParts } from "./buildElephantFromBodyParts.js";

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
  const speciesName = blueprint?.meta?.name || blueprint?.meta?.speciesName || "";
  const isElephant = speciesName.toLowerCase() === "elephant";
  const forceLegacy = blueprint?.meta?.forceLegacyBuild === true;

  if (isElephant) {
    return buildElephantFromBodyParts(blueprint, options);
  }
  // If the blueprint defines the new V2 anatomy fields, use the V2 builder.
  if (
    blueprint &&
    !forceLegacy &&
    Array.isArray(blueprint.chainsV2) &&
    Array.isArray(blueprint.bodyPartsV2)
  ) {
    return buildCreatureFromBlueprintV2(blueprint, options);
  }
  // Otherwise fall back to the legacy builder.
  return buildCreatureFromBlueprint(blueprint, options);
}

export { buildCreatureFromBlueprint };
