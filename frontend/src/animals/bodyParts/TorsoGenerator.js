import * as THREE from "three";
import { buildSegmentGeometry, getRadiusForChain } from "./utils.js";

/**
 * Generate a simple torso geometry for a chain of spine bones.
 *
 * This is intentionally generic and driven only by the blueprint:
 * - Uses the world positions of the spine chain.
 * - Uses the radius from blueprint.sizes.byChain["spine"] (or a default).
 */
export function generateTorsoGeometry(params) {
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
    // Fallback: a neutral sphere near the origin.
    return new THREE.SphereGeometry(0.5, 16, 16);
  }

  const start = points[0];
  const end = points[points.length - 1];

  const radius = getRadiusForChain(sizes, chainName, 0.35);
  const radialSegments =
    bodyPartOptions && typeof bodyPartOptions.sides === "number"
      ? bodyPartOptions.sides
      : 12;

  const geometry = buildSegmentGeometry(start, end, radius, radialSegments);
  geometry.name = `${blueprint.meta?.name || "Creature"}_${partName}_Torso`;
  return geometry;
}
