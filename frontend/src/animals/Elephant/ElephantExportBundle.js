import { ELEPHANT_SPECIES_KEY } from "./ElephantAdapterContract.js";

const EXPORT_FORMAT_VERSION = "1.0.0";

function normalizeAssets(assets = []) {
  return assets.map((asset) => ({
    name: asset.name || asset.id || "unnamed-asset",
    type: asset.type || asset.mimeType || "binary",
    uri: asset.uri || asset.url || null,
  }));
}

export function buildElephantExportManifest(compiled, assets = []) {
  if (!compiled) {
    throw new Error("buildElephantExportManifest requires a compiled elephant definition");
  }

  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    species: ELEPHANT_SPECIES_KEY,
    contractVersion: compiled.contractVersion,
    compilerVersion: compiled.compilerVersion,
    exportedAt: new Date().toISOString(),
    blueprint: {
      name: compiled.sourceMeta?.name || "Elephant",
      version: compiled.sourceMeta?.version || "unversioned",
      schemaVersion: compiled.sourceMeta?.schemaVersion || null,
    },
    assets: normalizeAssets(assets),
  };
}

export function buildElephantExportDefinition(compiled) {
  if (!compiled) {
    throw new Error("buildElephantExportDefinition requires a compiled elephant definition");
  }

  return {
    species: ELEPHANT_SPECIES_KEY,
    contractVersion: compiled.contractVersion,
    compilerVersion: compiled.compilerVersion,
    canonicalDefinition: compiled.canonicalDefinition,
    skeleton: compiled.canonicalSkeleton,
    chains: compiled.canonicalChains,
    bodyParts: compiled.canonicalBodyParts,
    materialsIntent: compiled.materialsIntent,
    locomotion: compiled.locomotion || {},
    validation: compiled.validation || { errors: [], warnings: [] },
    contractSnapshot: compiled.contractSnapshot,
  };
}

export function buildElephantExportBundle(compiled, { assets = [] } = {}) {
  const normalizedAssets = normalizeAssets(assets);
  const manifest = buildElephantExportManifest(compiled, normalizedAssets);
  const definition = buildElephantExportDefinition(compiled);

  return {
    manifest,
    definition,
    assets: normalizedAssets,
  };
}

export default buildElephantExportBundle;
