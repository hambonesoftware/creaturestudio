import * as THREE from "three";
import {
  buildSkinnedTubeGeometry,
  expandRadii,
  normalizeGeneratorParams,
  resolveBoneNames,
  resolveChainPositions,
} from "./utils.js";

export function generateTailGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    baseRadius = 0.12,
    tipRadius = 0.05,
    sides = 14,
    capStart = true,
    capEnd = true,
    partName = "tail",
  } = options;

  const points = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (points.length < 2) {
    return new THREE.CylinderGeometry(baseRadius, tipRadius, 0.8, Math.max(6, sides));
  }

  const radiiArray = radii.length > 0
    ? expandRadii(radii, points.length, baseRadius)
    : expandRadii([baseRadius, tipRadius], points.length, baseRadius);

  const geometry = buildSkinnedTubeGeometry({
    points,
    radii: radiiArray,
    sides,
    capStart,
    capEnd,
    skeleton,
    boneNames: resolveBoneNames(options),
  });

  geometry.name = `${partName}_Tail`;
  return geometry;
}
