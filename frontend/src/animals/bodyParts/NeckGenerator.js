import * as THREE from "three";
import { buildSegmentGeometry, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple neck geometry along the neck chain.
 */
export function generateNeckGeometry(params) {
  const {
    blueprint,
    partName,
    chainName,
    chainWorldPositions,
    sizes,
    bodyPartOptions,
  } = params;

  const points = chainWorldPositions || [];
  if (points.length === 0) {
    return new THREE.SphereGeometry(0.2, 12, 12);
  }

  const start = points[0];
  const end = points[points.length - 1];

  const radius = getRadiusForChain(sizes, chainName, 0.25) * 0.7;
  const radialSegments =
    bodyPartOptions && typeof bodyPartOptions.sides === "number"
      ? bodyPartOptions.sides
      : 10;

  const geometry = buildSegmentGeometry(start, end, radius, radialSegments);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Neck`;
  return geometry;
}
