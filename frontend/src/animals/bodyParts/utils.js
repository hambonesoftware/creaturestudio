import * as THREE from "three";

/**
 * Build a cylinder-like segment geometry between two points.
 *
 * The geometry is oriented from start -> end and centered at the midpoint.
 */
export function buildSegmentGeometry(start, end, radius, radialSegments = 8) {
  const startVec = start.clone();
  const endVec = end.clone();
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  const safeRadius = typeof radius === "number" && radius > 0 ? radius : 0.25;
  const safeLength = length > 1e-5 ? length : safeRadius * 0.5;

  const geometry = new THREE.CylinderGeometry(
    safeRadius,
    safeRadius,
    safeLength,
    Math.max(3, radialSegments)
  );

  // By default, CylinderGeometry is aligned along the Y axis.
  const up = new THREE.Vector3(0, 1, 0);
  const targetDirection =
    length > 1e-5 ? direction.clone().normalize() : up.clone();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    up,
    targetDirection
  );
  geometry.applyQuaternion(quaternion);

  const midpoint = new THREE.Vector3()
    .addVectors(startVec, endVec)
    .multiplyScalar(0.5);
  geometry.translate(midpoint.x, midpoint.y, midpoint.z);

  return geometry;
}

/**
 * Compute the average position of an array of THREE.Vector3 points.
 */
export function computeAveragePoint(points) {
  const result = new THREE.Vector3(0, 0, 0);
  if (!points || points.length === 0) {
    return result;
  }
  for (const p of points) {
    result.add(p);
  }
  result.multiplyScalar(1 / points.length);
  return result;
}

/**
 * Get a reasonable radius for a chain from the blueprint sizes.
 */
export function getRadiusForChain(sizes, chainName, fallbackRadius = 0.25) {
  if (!sizes) {
    return fallbackRadius;
  }

  const { defaultRadius, byChain } = sizes;
  if (
    byChain &&
    Object.prototype.hasOwnProperty.call(byChain, chainName) &&
    byChain[chainName] &&
    typeof byChain[chainName].radius === "number"
  ) {
    return byChain[chainName].radius;
  }

  if (typeof defaultRadius === "number") {
    return defaultRadius;
  }

  return fallbackRadius;
}
