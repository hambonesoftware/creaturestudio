import * as THREE from "three";
import { buildSegmentGeometry, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple limb geometry (front or back leg).
 */
export function generateLimbGeometry(params) {
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
    return new THREE.CylinderGeometry(0.12, 0.12, 1.0, 10);
  }

  const start = points[0];
  const end = points[points.length - 1];

  const baseRadius = getRadiusForChain(sizes, chainName, 0.2);
  const radius = baseRadius * 0.8;

  const radialSegments =
    bodyPartOptions && typeof bodyPartOptions.sides === "number"
      ? bodyPartOptions.sides
      : 10;

  const geometry = buildSegmentGeometry(start, end, radius, radialSegments);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Limb`;
  return geometry;
}
