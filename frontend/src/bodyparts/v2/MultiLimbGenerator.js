import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { generateLimbGeometry } from "./LimbGenerator.js";

function normalizeChain(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  if (candidate.name && Array.isArray(candidate.bones)) {
    return {
      name: candidate.name,
      boneNames: [...candidate.bones],
      radii: Array.isArray(candidate.radii) ? [...candidate.radii] : undefined,
      profile: candidate.profile,
      extendTo: candidate.extendTo,
    };
  }
  if (candidate.name && Array.isArray(candidate.boneNames)) {
    return {
      name: candidate.name,
      boneNames: [...candidate.boneNames],
      radii: Array.isArray(candidate.radii) ? [...candidate.radii] : undefined,
      profile: candidate.profile,
      extendTo: candidate.extendTo,
    };
  }
  return null;
}

/**
 * Generate geometry for multiple limb chains and merge them into a single mesh.
 *
 * The primary chain is provided by the runtime via the `chain` parameter. Any
 * additional chains may be supplied through `options.additionalChains`, either
 * as full chain definitions or as lightweight objects with `name` and
 * `boneNames` fields. Per-chain radii overrides can be supplied via
 * `options.radiiByChain`.
 */
export function generateMultiLimbGeometry({ skeleton, chain, options = {} }) {
  const chains = [chain, ...(Array.isArray(options.additionalChains) ? options.additionalChains : [])]
    .map(normalizeChain)
    .filter(Boolean);

  const geometries = [];
  for (const entry of chains) {
    const perChainOptions = { ...options };
    delete perChainOptions.additionalChains;
    if (options.radiiByChain && typeof options.radiiByChain === "object") {
      const override = options.radiiByChain[entry.name];
      if (Array.isArray(override)) {
        perChainOptions.radii = [...override];
      }
    }
    const result = generateLimbGeometry({ skeleton, chain: entry, options: perChainOptions });
    if (result?.geometry instanceof THREE.BufferGeometry) {
      geometries.push(result.geometry);
    }
  }

  if (geometries.length === 0) {
    return { geometry: new THREE.BufferGeometry(), meta: undefined };
  }

  const merged = mergeGeometries(geometries, true);
  merged.computeVertexNormals();
  return { geometry: merged, meta: options.meta };
}
