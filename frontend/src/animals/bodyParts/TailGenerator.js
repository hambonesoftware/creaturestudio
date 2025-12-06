import * as THREE from "three";
import { buildSegmentGeometry, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple tail geometry along the tail chain.
 */
export function generateTailGeometry(params) {
  const { blueprint, partName, chainName, chainWorldPositions, sizes } = params;

  const points = chainWorldPositions || [];
  if (points.length === 0) {
    return new THREE.SphereGeometry(0.05, 8, 8);
  }

  const start = points[0];
  const end = points[points.length - 1];

  const baseRadius = getRadiusForChain(sizes, chainName, 0.08);
  const radius = baseRadius * 0.7;

  const geometry = buildSegmentGeometry(start, end, radius, 8);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Tail`;
  return geometry;
}
