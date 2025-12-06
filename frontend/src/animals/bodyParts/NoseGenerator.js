import * as THREE from "three";
import { buildSegmentGeometry, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple nose/trunk geometry along the trunk chain.
 *
 * The blueprint may call this generator "nose" or "trunk".
 */
export function generateNoseGeometry(params) {
  const { blueprint, partName, chainName, chainWorldPositions, sizes } = params;

  const points = chainWorldPositions || [];
  if (points.length === 0) {
    return new THREE.CylinderGeometry(0.1, 0.14, 0.8, 12);
  }

  const start = points[0];
  const end = points[points.length - 1];

  const baseRadius = getRadiusForChain(sizes, chainName, 0.18);
  const radius = baseRadius * 0.7;

  const geometry = buildSegmentGeometry(start, end, radius, 12);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Nose`;
  return geometry;
}
