/**
 * Validate and normalise anatomy V2 chain/body-part data from a SpeciesBlueprint.
 * Throws informative errors when chains or body parts are missing or misconfigured.
 */
export function validateAnatomyV2(blueprint, { generatorKeys = [] } = {}) {
  if (!blueprint) {
    throw new Error('[BlueprintValidation] Blueprint is required');
  }
  const skeletonBones = new Set((blueprint.skeleton?.bones || []).map((b) => b?.name).filter(Boolean));
  if (skeletonBones.size === 0) {
    throw new Error('[BlueprintValidation] skeleton.bones is required for anatomy V2');
  }

  const anatomy = blueprint.anatomy || {};
  const chainDefsRaw = Array.isArray(anatomy.chains) ? anatomy.chains : blueprint?.chainsV2;
  if (!Array.isArray(chainDefsRaw) || chainDefsRaw.length === 0) {
    throw new Error('[BlueprintValidation] chainsV2/anatomy.chains must contain at least one chain');
  }

  const chains = chainDefsRaw
    .map((def) => {
      if (!def || typeof def.name !== 'string') return null;
      const bones = Array.isArray(def.boneNames) ? def.boneNames : def.bones;
      if (!Array.isArray(bones) || bones.length === 0) {
        throw new Error(`[BlueprintValidation] Chain '${def.name}' is missing bones[]`);
      }
      const missingBones = bones.filter((b) => !skeletonBones.has(b));
      if (missingBones.length > 0) {
        throw new Error(
          `[BlueprintValidation] Chain '${def.name}' references unknown bones: ${missingBones.join(', ')}`
        );
      }
      return {
        name: def.name,
        bones: [...bones],
        radii: Array.isArray(def.radii) ? [...def.radii] : undefined,
        profile: def.profile,
        extendTo: def.extendTo,
      };
    })
    .filter(Boolean);

  if (chains.length === 0) {
    throw new Error('[BlueprintValidation] No usable chain definitions were found');
  }

  const chainNames = new Set(chains.map((c) => c.name));
  const bodyPartsRaw = [];

  if (Array.isArray(anatomy.bodyParts)) {
    bodyPartsRaw.push(...anatomy.bodyParts);
  }

  if (anatomy.generators && typeof anatomy.generators === 'object') {
    for (const [chainName, entry] of Object.entries(anatomy.generators)) {
      if (!entry) continue;
      const generatorKey = entry.generator || entry.type;
      if (!generatorKey) continue;
      bodyPartsRaw.push({
        name: entry.name || chainName,
        chain: chainName,
        generator: generatorKey,
        options: entry.options,
      });
    }
  }

  if (Array.isArray(blueprint?.bodyPartsV2)) {
    bodyPartsRaw.push(...blueprint.bodyPartsV2);
  }

  if (bodyPartsRaw.length === 0) {
    throw new Error('[BlueprintValidation] bodyPartsV2/anatomy.bodyParts must define at least one part');
  }

  const bodyParts = bodyPartsRaw.map((raw) => {
    if (!raw.generator) {
      throw new Error(`[BlueprintValidation] Body part '${raw.name || raw.chain}' is missing a generator key`);
    }
    if (generatorKeys.length > 0 && !generatorKeys.includes(raw.generator)) {
      throw new Error(
        `[BlueprintValidation] Body part '${raw.name || raw.chain}' uses unknown generator '${raw.generator}'. ` +
          `Known generators: ${generatorKeys.join(', ')}`
      );
    }
    if (!raw.chain || !chainNames.has(raw.chain)) {
      const available = [...chainNames].join(', ');
      throw new Error(
        `[BlueprintValidation] Body part '${raw.name || raw.generator}' targets missing chain '${raw.chain}'. ` +
          `Available chains: ${available}`
      );
    }

    const options = raw.options ? { ...raw.options } : {};
    const extraChains = Array.isArray(options.additionalChains) ? options.additionalChains : [];
    const missingExtra = extraChains
      .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
      .filter(Boolean)
      .filter((name) => !chainNames.has(name));
    if (missingExtra.length > 0) {
      throw new Error(
        `[BlueprintValidation] Body part '${raw.name || raw.generator}' references unknown additionalChains: ${missingExtra.join(', ')}`
      );
    }

    return {
      name: raw.name || raw.chain,
      chain: raw.chain,
      generator: raw.generator,
      options,
    };
  });

  return { chains, bodyParts };
}
