import * as THREE from "three";
import {
  buildSkinnedTubeGeometry,
  expandRadii,
  normalizeGeneratorParams,
  resolveBoneNames,
  resolveChainPositions,
  sampleWorldPositionsFromBones,
} from "./utils.js";

function applyRumpExtension(radii, points, extendConfig, skeleton) {
  if (!extendConfig || !extendConfig.bones || !skeleton) {
    return radii;
  }

  const rumpCenter = points[0];
  if (!rumpCenter) {
    return radii;
  }

  const legPositions = sampleWorldPositionsFromBones(skeleton, extendConfig.bones);
  if (legPositions.length === 0) {
    return radii;
  }

  let maxDistance = 0;
  for (const pos of legPositions) {
    maxDistance = Math.max(maxDistance, rumpCenter.distanceTo(pos));
  }

  const margin = typeof extendConfig.extraMargin === "number" ? extendConfig.extraMargin : 0;
  const inflated = Math.max(radii[0] || 0.25, maxDistance + margin);
  const adjusted = [...radii];
  adjusted[0] = inflated;
  return adjusted;
}

export function generateTorsoGeometry(arg1, arg2 = {}) {
  const params = normalizeGeneratorParams(arg1, arg2);
  const options = { ...params, ...(params.bodyPartOptions || {}) };
  const {
    skeleton,
    bones = [],
    chainBones,
    chainWorldPositions,
    radii = [],
    sides = 28,
    radiusProfile,
    extendRumpToRearLegs,
    capStart = true,
    capEnd = true,
    lowPoly = false,
    lowPolySegments = 9,
    lowPolyWeldTolerance = 0,
    partName = "torso",
  } = options;

  const points = resolveChainPositions({
    skeleton,
    bones,
    chainBones,
    chainWorldPositions,
  });

  if (points.length < 2) {
    return new THREE.SphereGeometry(0.5, 12, 12);
  }

  let expandedRadii = expandRadii(radii, points.length, 0.35);
  expandedRadii = applyRumpExtension(expandedRadii, points, extendRumpToRearLegs, skeleton);

  const tube = buildSkinnedTubeGeometry({
    points,
    radii: expandedRadii,
    sides: lowPoly ? Math.max(3, lowPolySegments) : sides,
    radiusProfile,
    capStart,
    capEnd,
    skeleton,
    boneNames: resolveBoneNames(options),
    weldTolerance: lowPoly ? lowPolyWeldTolerance : 0,
  });

  tube.name = `${partName}_Torso`;
  return tube;
}
