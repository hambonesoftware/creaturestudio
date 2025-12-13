import {
  ELEPHANT_SPECIES_KEY,
  buildCanonicalElephantBodyParts,
  buildCanonicalElephantChains,
  buildCanonicalElephantSkeleton,
  buildElephantContractSnapshot,
  mergeElephantMaterialsIntent,
} from "./ElephantAdapterContract.js";
import { ElephantDefinition } from "./ElephantDefinition.js";
import { QuadrupedBlueprintAdapter } from "../blueprint/adapters/QuadrupedBlueprintAdapter.js";

const DEFAULT_CONTRACT_VERSION = "1.0.0";
const DEFAULT_COMPILER_VERSION = "0.2.0";

function deepClone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

export class ElephantBlueprintAdapter {
  constructor({ contractVersion, compilerVersion, zooParityDefault = true } = {}) {
    this.contractVersion = contractVersion || DEFAULT_CONTRACT_VERSION;
    this.compilerVersion = compilerVersion || DEFAULT_COMPILER_VERSION;
    this.zooParityDefault = zooParityDefault;
    this.quadrupedAdapter = new QuadrupedBlueprintAdapter();
  }

  compile(blueprint, options = {}) {
    const adapted = this.adapt(blueprint, options);

    return {
      contractVersion: this.contractVersion,
      compilerVersion: this.compilerVersion,
      species: ELEPHANT_SPECIES_KEY,
      bodyPlanType: adapted.bodyPlanType,
      compiledAt: new Date().toISOString(),
      sourceMeta: adapted.sourceMeta,
      canonicalSkeleton: adapted.canonicalSkeleton,
      canonicalChains: adapted.canonicalChains,
      canonicalBodyParts: adapted.canonicalBodyParts,
      canonicalDefinition: adapted.canonicalDefinition,
      materialsIntent: adapted.materialsIntent,
      locomotion: adapted.locomotion,
      validation: adapted.validation,
      contractSnapshot: adapted.contractSnapshot,
      runtime: { blueprint: adapted.runtimeBlueprint },
    };
  }

  adapt(blueprint, options = {}) {
    if (!blueprint) {
      throw new Error("ElephantBlueprintAdapter requires a SpeciesBlueprint");
    }

    const parityMode = options.zooParity !== undefined ? options.zooParity : this.zooParityDefault;
    const base = this.quadrupedAdapter.adapt(blueprint);

    const canonicalSkeleton = buildCanonicalElephantSkeleton(parityMode, base.canonicalSkeleton);
    const canonicalChains = buildCanonicalElephantChains();
    const canonicalBodyParts = buildCanonicalElephantBodyParts();
    const materialsIntent = mergeElephantMaterialsIntent(base.materialsIntent || {});

    const runtimeBlueprint = JSON.parse(JSON.stringify(base.runtimeBlueprint || blueprint || {}));
    runtimeBlueprint.meta = {
      ...(runtimeBlueprint.meta || {}),
      zooParity: parityMode,
      speciesKey: ELEPHANT_SPECIES_KEY,
    };
    runtimeBlueprint.bodyPlan = { ...(runtimeBlueprint.bodyPlan || {}), type: "quadruped", species: ELEPHANT_SPECIES_KEY };
    runtimeBlueprint.skeleton = canonicalSkeleton;
    runtimeBlueprint.chainsV2 = canonicalChains.map((chain) => ({ name: chain.name, bones: [...chain.bones] }));
    runtimeBlueprint.bodyPartsV2 = canonicalBodyParts.map((part) => ({
      name: part.name,
      generator: part.generator,
      chain: part.chain,
      options: deepClone(part.options),
    }));

    const validation = base.validation || { errors: [], warnings: [] };
    for (const defBone of ElephantDefinition.bones) {
      const exists = canonicalSkeleton.bones.find((bone) => bone.name === defBone.name);
      if (!exists) {
        validation.errors.push(`Missing elephant bone: ${defBone.name}`);
      }
    }

    const sourceMeta = {
      name: blueprint?.meta?.name || "Elephant",
      version: blueprint?.meta?.version || "unversioned",
      schemaVersion: blueprint?.meta?.schemaVersion || null,
    };

    const contractSnapshot = buildElephantContractSnapshot({ parityMode, baseSkeleton: base.canonicalSkeleton });

    return {
      bodyPlanType: "quadruped",
      canonicalSkeleton,
      canonicalChains,
      canonicalBodyParts,
      canonicalDefinition: contractSnapshot.canonicalDefinition,
      materialsIntent,
      locomotion: base.locomotion || {},
      runtimeBlueprint,
      validation,
      sourceMeta,
      contractSnapshot,
    };
  }
}

export default ElephantBlueprintAdapter;
