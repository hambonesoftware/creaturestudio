import * as THREE from "three";
import { computeAveragePoint, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple ear geometry as a flat plane near the ear bones.
 */
export function generateEarGeometry(params) {
  const { blueprint, partName, chainName, chainWorldPositions, sizes } = params;

  const points = chainWorldPositions || [];
  if (points.length === 0) {
    return new THREE.PlaneGeometry(0.4, 0.4, 1, 1);
  }

  const radius = getRadiusForChain(sizes, chainName, 0.05);
  const width = radius * 6.0;
  const height = radius * 4.0;

  const center = computeAveragePoint(points);
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);

  // By default PlaneGeometry lies in X-Y plane. We simply translate it to the ear center.
  geometry.translate(center.x, center.y, center.z);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Ear`;
  return geometry;
}
