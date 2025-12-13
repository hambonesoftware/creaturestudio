/**
 * QuadrupedBlueprintAdapter
 * -------------------------
 *
 * Converts a SpeciesBlueprint with a quadruped body plan into a canonical,
 * deterministic representation that downstream generators and exporters can
 * consume. The adapter enforces naming rules, validates required anatomy, and
 * emits a normalized runtime-ready blueprint alongside canonical chain/body
 * part listings.
 */

const REQUIRED_CHAINS = ["spine", "neck", "head", "frontLegL", "frontLegR", "backLegL", "backLegR"];
const OPTIONAL_CHAINS = ["tail", "earLeft", "earRight", "trunk"];

function deepClone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function normalizeVector(vec) {
  if (!Array.isArray(vec) || vec.length !== 3) return [0, 0, 0];
  return vec.map((n) => (typeof n === "number" && Number.isFinite(n) ? n : 0));
}

export class QuadrupedBlueprintAdapter {
  /**
   * Adapt a quadruped SpeciesBlueprint into a canonical compiled representation.
   *
   * @param {import("../../../types/SpeciesBlueprint").SpeciesBlueprint} blueprint
   * @returns {object}
   */
  adapt(blueprint) {
    if (!blueprint) {
      throw new Error("QuadrupedBlueprintAdapter requires a SpeciesBlueprint");
    }

    const validation = { errors: [], warnings: [] };
    this.#validateBodyPlan(blueprint, validation);

    const canonicalSkeleton = this.#normalizeSkeleton(blueprint.skeleton, validation);
    const canonicalChains = this.#normalizeChains(blueprint.chainsV2 || [], canonicalSkeleton, validation);
    const canonicalBodyParts = this.#normalizeBodyParts(blueprint.bodyPartsV2 || [], canonicalChains, validation);

    const runtimeBlueprint = this.#buildRuntimeBlueprint(
      blueprint,
      canonicalSkeleton,
      canonicalChains,
      canonicalBodyParts,
    );

    return {
      bodyPlanType: "quadruped",
      canonicalSkeleton,
      canonicalChains,
      canonicalBodyParts,
      materialsIntent: this.#deriveMaterialsIntent(blueprint.materials),
      locomotion: this.#deriveLocomotionIntent(blueprint.behaviorPresets),
      runtimeBlueprint,
      validation,
    };
  }

  #validateBodyPlan(blueprint, validation) {
    const type = blueprint?.bodyPlan?.type;
    if (type !== "quadruped") {
      validation.errors.push(`Expected bodyPlan.type=\"quadruped\" but received ${type || "undefined"}`);
    }
  }

  #normalizeSkeleton(skeleton, validation) {
    const bones = [];
    const seen = new Set();
    const inputBones = Array.isArray(skeleton?.bones) ? skeleton.bones : [];

    for (const bone of inputBones) {
      const name = bone?.name;
      if (!name) {
        validation.warnings.push("Encountered a bone without a name; skipping");
        continue;
      }
      if (seen.has(name)) {
        validation.errors.push(`Duplicate bone name detected: ${name}`);
        continue;
      }
      seen.add(name);
      bones.push({
        name,
        parent: bone?.parent || "",
        position: normalizeVector(bone?.position),
      });
    }

    if (bones.length === 0) {
      validation.errors.push("Skeleton must contain at least one bone");
    }

    const rootName = skeleton?.root || bones[0]?.name || "root";
    return { root: rootName, bones };
  }

  #normalizeChains(chains, canonicalSkeleton, validation) {
    const byName = new Map();
    const skeletonBoneNames = new Set(canonicalSkeleton.bones.map((b) => b.name));

    for (const chain of Array.isArray(chains) ? chains : []) {
      if (!chain || !chain.name) {
        validation.warnings.push("Encountered a chain without a name; skipping");
        continue;
      }
      const name = chain.name;
      if (byName.has(name)) {
        validation.errors.push(`Duplicate chain definition for ${name}`);
        continue;
      }
      const bones = [];
      const seen = new Set();
      const boneList = Array.isArray(chain.bones) ? chain.bones : chain.boneNames;
      for (const boneName of Array.isArray(boneList) ? boneList : []) {
        if (seen.has(boneName)) continue;
        if (!skeletonBoneNames.has(boneName)) {
          validation.errors.push(`Chain ${name} references missing bone ${boneName}`);
          continue;
        }
        seen.add(boneName);
        bones.push(boneName);
      }

      if (bones.length === 0) {
        validation.errors.push(`Chain ${name} must include at least one bone`);
        continue;
      }

      byName.set(name, { name, bones, profile: chain.profile, extendTo: chain.extendTo, radii: chain.radii });
    }

    for (const required of REQUIRED_CHAINS) {
      if (!byName.has(required)) {
        validation.errors.push(`Missing required chain: ${required}`);
      }
    }

    const ordered = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
    return ordered;
  }

  #normalizeBodyParts(bodyParts, canonicalChains, validation) {
    const chainNames = new Set(canonicalChains.map((c) => c.name));
    const seen = new Set();
    const parts = [];

    for (const part of Array.isArray(bodyParts) ? bodyParts : []) {
      const name = part?.name;
      if (!name) {
        validation.warnings.push("Encountered a body part without a name; skipping");
        continue;
      }
      if (seen.has(name)) {
        validation.errors.push(`Duplicate body part definition: ${name}`);
        continue;
      }
      if (!part.chain) {
        validation.errors.push(`Body part ${name} is missing a chain reference`);
        continue;
      }
      if (!chainNames.has(part.chain)) {
        validation.errors.push(`Body part ${name} references unknown chain ${part.chain}`);
        continue;
      }
      if (!part.generator) {
        validation.errors.push(`Body part ${name} is missing a generator key`);
        continue;
      }
      seen.add(name);
      parts.push({
        name,
        generator: part.generator,
        chain: part.chain,
        options: deepClone(part.options || {}),
      });
    }

    for (const required of REQUIRED_CHAINS) {
      if (!parts.find((p) => p.chain === required)) {
        validation.errors.push(`Missing body part mapped to required chain: ${required}`);
      }
    }

    return parts.sort((a, b) => a.name.localeCompare(b.name));
  }

  #deriveMaterialsIntent(materials) {
    const surface = materials?.surface ? deepClone(materials.surface) : {};
    const eye = materials?.eye ? deepClone(materials.eye) : {};
    const tusk = materials?.tusk ? deepClone(materials.tusk) : {};
    return { surface, eye, tusk };
  }

  #deriveLocomotionIntent(behaviorPresets) {
    if (!behaviorPresets) return {};
    const locomotion = {};
    if (behaviorPresets.gait) {
      locomotion.defaultGait = behaviorPresets.gait;
    }
    if (Array.isArray(behaviorPresets.tags)) {
      locomotion.tags = [...behaviorPresets.tags];
    }
    return locomotion;
  }

  #buildRuntimeBlueprint(blueprint, canonicalSkeleton, canonicalChains, canonicalBodyParts) {
    const runtimeBlueprint = deepClone(blueprint) || {};

    runtimeBlueprint.bodyPlan = { ...(runtimeBlueprint.bodyPlan || {}), type: "quadruped" };
    runtimeBlueprint.skeleton = canonicalSkeleton;
    runtimeBlueprint.chainsV2 = canonicalChains.map((chain) => ({
      name: chain.name,
      bones: [...chain.bones],
      profile: chain.profile,
      extendTo: chain.extendTo,
      radii: chain.radii,
    }));
    runtimeBlueprint.bodyPartsV2 = canonicalBodyParts.map((part) => ({
      name: part.name,
      generator: part.generator,
      chain: part.chain,
      options: deepClone(part.options || {}),
    }));

    // Ensure optional chain placeholders remain deterministic even if absent in the input.
    for (const optionalChain of OPTIONAL_CHAINS) {
      if (!runtimeBlueprint.chainsV2.find((c) => c.name === optionalChain)) {
        runtimeBlueprint.chainsV2.push({ name: optionalChain, bones: [] });
      }
    }

    runtimeBlueprint.chainsV2.sort((a, b) => a.name.localeCompare(b.name));
    runtimeBlueprint.bodyPartsV2.sort((a, b) => a.name.localeCompare(b.name));

    return runtimeBlueprint;
  }
}

export default QuadrupedBlueprintAdapter;
