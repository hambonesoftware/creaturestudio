import * as THREE from "three";
import {
  buildSkinnedTubeGeometry,
  expandRadii,
  normalizeGeneratorParams,
  resolveBoneNames,
  resolveChainPositions,
} from "./utils.js";

export function generateLimbGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    sides = 16,
    capStart = true,
    capEnd = true,
    partName = "limb",
  } = options;

  const points = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (points.length < 2) {
    return new THREE.CylinderGeometry(0.15, 0.15, 0.5, Math.max(6, sides));
  }

  const expandedRadii = expandRadii(radii, points.length, 0.2);

  const geometry = buildSkinnedTubeGeometry({
    points,
    radii: expandedRadii,
    sides,
    capStart,
    capEnd,
    skeleton,
    boneNames: resolveBoneNames(options),
  });

  geometry.name = `${partName}_Limb`;
  return geometry;
}
