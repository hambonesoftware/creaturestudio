import { normalizeGeneratorParams, resolveChainPositions } from "./utils.js";
import { generateTailGeometry } from "./TailGenerator.js";

const DEFAULT_ROOTS = ["head_tip_2", "head_tip_1", "head"];

function resolveRootBoneName(skeleton, preferredRoot, fallbackRoots) {
  if (!skeleton?.bones) {
    return preferredRoot || null;
  }

  const candidates = preferredRoot
    ? [preferredRoot, ...fallbackRoots.filter((name) => name !== preferredRoot)]
    : [...fallbackRoots];

  return candidates.find((name) => skeleton.bones.some((bone) => bone.name === name)) || null;
}

export function generateNoseGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    rootBone,
    fallbackRoots = DEFAULT_ROOTS,
    radii = [],
    baseRadius = 0.2,
    midRadius,
    tipRadius = 0.1,
    sides = 16,
    lengthScale = 1.0,
    partName = "nose",
  } = options;

  const resolvedRoot = resolveRootBoneName(skeleton, rootBone, fallbackRoots);

  const chainPositions = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  const tailBones = resolvedRoot ? [resolvedRoot, ...bones] : bones;
  const noseRadii =
    radii.length > 0 ? radii : [baseRadius, midRadius || baseRadius * 0.7, tipRadius];

  const geometry = generateTailGeometry({
    skeleton,
    bones: tailBones,
    chainBones: resolvedRoot ? null : chainBones,
    chainWorldPositions: resolvedRoot ? null : chainWorldPositions,
    radii: noseRadii.map((r) => r * lengthScale),
    baseRadius: baseRadius * lengthScale,
    midRadius: (midRadius || baseRadius * 0.7) * lengthScale,
    tipRadius: tipRadius * lengthScale,
    sides,
    partName,
    runtimeOptions: options.runtimeOptions,
  });

  geometry.name = `${partName}_Nose`;
  return geometry;
}
