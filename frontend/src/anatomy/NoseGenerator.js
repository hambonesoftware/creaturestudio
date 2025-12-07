import * as THREE from "three";
import {
  buildSkinnedTubeGeometry,
  expandRadii,
  normalizeGeneratorParams,
  resolveBoneNames,
  resolveChainPositions,
  sampleWorldPositionsFromBones,
} from "./utils.js";

export function generateNoseGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    rootBone,
    radii = [],
    baseRadius = 0.2,
    midRadius,
    tipRadius = 0.1,
    sides = 16,
    capStart = true,
    capEnd = true,
    lengthScale = 1.0,
    partName = "nose",
  } = options;

  let points = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (rootBone && skeleton) {
    const [rootPos] = sampleWorldPositionsFromBones(skeleton, [rootBone]);
    if (rootPos) {
      points = [rootPos, ...points];
    }
  }

  if (points.length < 2) {
    return new THREE.CylinderGeometry(baseRadius, tipRadius, 0.8 * lengthScale, Math.max(6, sides));
  }

  let baseRadii = radii;
  if (radii.length === 0) {
    baseRadii = [baseRadius, midRadius || baseRadius * 0.7, tipRadius];
  }

  const radiiArray = expandRadii(
    baseRadii.map((r) => r * lengthScale),
    points.length,
    baseRadius * lengthScale
  );

  const geometry = buildSkinnedTubeGeometry({
    points,
    radii: radiiArray,
    sides,
    capStart,
    capEnd,
    skeleton,
    boneNames: resolveBoneNames(options),
  });

  geometry.name = `${partName}_Nose`;
  return geometry;
}
