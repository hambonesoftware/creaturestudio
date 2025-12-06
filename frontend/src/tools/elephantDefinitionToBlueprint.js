import { ElephantDefinition, ElephantBlueprintBoneMap } from "../animals/Elephant/ElephantDefinition.js";

const DEFAULT_COORDINATE_SYSTEM = "Y-up, Z-forward, X-right";
const FALLBACK_PARENTS = {
  trunk_root: "head", // parent trunk chain to head when trunk_anchor is omitted in the blueprint
  tail_base: "spine_base", // parent tail chain to spine base when spine_tail is omitted
};

function normalizePosition(position) {
  const [x = 0, y = 0, z = 0] = Array.isArray(position) ? position : [0, 0, 0];
  return [Number(x) || 0, Number(y) || 0, Number(z) || 0];
}

function mapParentName(definitionParent, boneName) {
  if (!definitionParent || definitionParent === "root") {
    return "root";
  }

  const mappedParent = ElephantBlueprintBoneMap[definitionParent];
  if (typeof mappedParent === "string" && mappedParent.length > 0) {
    return mappedParent;
  }

  const fallback = FALLBACK_PARENTS[boneName];
  if (fallback) {
    return fallback;
  }

  return "root";
}

function mapBone(defBone, includeUnmapped) {
  const mappedName = ElephantBlueprintBoneMap[defBone.name] ?? defBone.name;
  if (!mappedName) {
    return includeUnmapped
      ? {
          name: defBone.name,
          parent: defBone.parent || "root",
          position: normalizePosition(defBone.position),
          rotation: defBone.rotation,
          unmapped: true,
        }
      : null;
  }

  return {
    name: mappedName,
    parent: mapParentName(defBone.parent, defBone.name),
    position: normalizePosition(defBone.position),
  };
}

function computeRadius(sizeVec) {
  if (!Array.isArray(sizeVec) || sizeVec.length === 0) {
    return null;
  }
  const [x = 0, y = 0, z = 0] = sizeVec;
  const numbers = [Number(x) || 0, Number(y) || 0, Number(z) || 0];
  const sum = numbers.reduce((acc, value) => acc + value, 0);
  return sum / numbers.length;
}

export function convertElephantDefinitionToSkeletonBlueprint(options = {}) {
  const { includeUnmapped = false, coordinateSystem = DEFAULT_COORDINATE_SYSTEM } = options;

  const mappedBones = [];
  const skipped = [];

  for (const bone of ElephantDefinition.bones) {
    const mapped = mapBone(bone, includeUnmapped);
    if (!mapped) {
      skipped.push(bone.name);
      continue;
    }
    mappedBones.push(mapped);
  }

  const byBone = {};
  Object.entries(ElephantDefinition.sizes || {}).forEach(([defName, sizeVec]) => {
    const blueprintName = ElephantBlueprintBoneMap[defName];
    if (!blueprintName) {
      return;
    }
    const radius = computeRadius(sizeVec);
    if (radius !== null) {
      byBone[blueprintName] = { radius };
    }
  });

  const skeletonRoot = ElephantBlueprintBoneMap.spine_base || "spine_base";

  return {
    skeleton: {
      root: skeletonRoot,
      coordinateSystem,
      bones: mappedBones,
    },
    sizes: {
      byBone,
    },
    meta: {
      source: `${ElephantDefinition.name} ${ElephantDefinition.variant || ""}`.trim(),
      skippedDefinitionBones: skipped,
    },
  };
}

export function logElephantSkeletonBlueprint(options = {}) {
  const converted = convertElephantDefinitionToSkeletonBlueprint(options);
  /* eslint-disable no-console */
  console.log(JSON.stringify(converted, null, 2));
  /* eslint-enable no-console */
  return converted;
}

export default convertElephantDefinitionToSkeletonBlueprint;
