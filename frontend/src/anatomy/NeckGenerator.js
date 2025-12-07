import * as THREE from "three";
import {
  buildSkinnedTubeGeometry,
  expandRadii,
  normalizeGeneratorParams,
  resolveBoneNames,
  resolveChainPositions,
} from "./utils.js";

export function generateNeckGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    sides = 18,
    yOffset = 0,
    capBase = true,
    capEnd = true,
    partName = "neck",
  } = options;

  const points = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (points.length < 2) {
    return new THREE.CylinderGeometry(0.35, 0.35, 0.5, Math.max(6, sides));
  }

  if (yOffset !== 0) {
    for (const p of points) {
      p.y += yOffset;
    }
  }

  const expandedRadii = expandRadii(radii, points.length, 0.35);

  const geometry = buildSkinnedTubeGeometry({
    points,
    radii: expandedRadii,
    sides,
    capStart: capBase,
    capEnd,
    skeleton,
    boneNames: resolveBoneNames(options),
  });

  geometry.name = `${partName}_Neck`;
  return geometry;
}
