import * as THREE from "three";
import { computeAveragePoint, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple head geometry centered on the head chain.
 */
export function generateHeadGeometry(params) {
  const { blueprint, partName, chainName, chainWorldPositions, sizes } = params;

  const points = chainWorldPositions || [];
  if (points.length === 0) {
    return new THREE.SphereGeometry(0.3, 16, 16);
  }

  const radius = getRadiusForChain(sizes, chainName, 0.28) * 1.1;
  const center = computeAveragePoint(points);

  const geometry = new THREE.SphereGeometry(radius, 18, 18);
  geometry.translate(center.x, center.y, center.z);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Head`;
  return geometry;
}
