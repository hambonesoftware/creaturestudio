import { ElephantDefinition } from "./ElephantDefinition.js";
import { QuadrupedBlueprintAdapter } from "../blueprint/adapters/QuadrupedBlueprintAdapter.js";

const DEFAULT_CONTRACT_VERSION = "1.0.0";
const DEFAULT_COMPILER_VERSION = "0.2.0";
const ELEPHANT_SPECIES_KEY = "elephant";

function deepClone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function definitionToSkeleton(parityMode, baseSkeleton) {
  const baseByName = new Map((baseSkeleton?.bones || []).map((bone) => [bone.name, bone]));

  const bones = ElephantDefinition.bones.map((bone) => {
    const fallback = baseByName.get(bone.name);
    const position = parityMode ? bone.position : fallback?.position || bone.position;

    return {
      name: bone.name,
      parent: bone.parent || "root",
      position: Array.isArray(position) ? position : [0, 0, 0],
    };
  });

  return { root: ElephantDefinition.root || "spine_base", bones };
}

function definitionChainsToList() {
  const chains = ElephantDefinition.chains || {};
  return Object.keys(chains)
    .map((name) => ({ name, bones: Array.isArray(chains[name]) ? [...chains[name]] : [] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCanonicalElephantBodyParts() {
  return [
    {
      name: "torso",
      generator: "torsoGenerator",
      chain: "spine",
      options: { radiusProfile: "elephant_heavy", sides: 28, extendRump: true },
    },
    {
      name: "head",
      generator: "headGenerator",
      chain: "head",
      options: { radius: 0.95, elongation: 1.0 },
    },
    {
      name: "trunk",
      generator: "noseGenerator",
      chain: "trunk",
      options: { partName: "trunk", sides: 24, tipTaper: 0.25 },
    },
    {
      name: "tail",
      generator: "tailGenerator",
      chain: "tail",
      options: { sides: 12, tuft: true },
    },
    {
      name: "ears_left",
      generator: "earGenerator",
      chain: "earLeft",
      options: { flatten: true, flare: 0.65 },
    },
    {
      name: "ears_right",
      generator: "earGenerator",
      chain: "earRight",
      options: { flatten: true, flare: 0.65 },
    },
    {
      name: "tusk_left",
      generator: "noseGenerator",
      chain: "tuskLeft",
      options: { partName: "tusk_left", sides: 14, lengthScale: 1.2 },
    },
    {
      name: "tusk_right",
      generator: "noseGenerator",
      chain: "tuskRight",
      options: { partName: "tusk_right", sides: 14, lengthScale: 1.2 },
    },
    {
      name: "front_leg_l",
      generator: "limbGenerator",
      chain: "frontLegL",
      options: { column: true, radiusScale: 1.1, sides: 14 },
    },
    {
      name: "front_leg_r",
      generator: "limbGenerator",
      chain: "frontLegR",
      options: { column: true, radiusScale: 1.1, sides: 14 },
    },
    {
      name: "back_leg_l",
      generator: "limbGenerator",
      chain: "backLegL",
      options: { column: true, radiusScale: 1.15, sides: 14 },
    },
    {
      name: "back_leg_r",
      generator: "limbGenerator",
      chain: "backLegR",
      options: { column: true, radiusScale: 1.15, sides: 14 },
    },
  ];
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
      materialsIntent: adapted.materialsIntent,
      locomotion: adapted.locomotion,
      validation: adapted.validation,
      runtime: { blueprint: adapted.runtimeBlueprint },
    };
  }

  adapt(blueprint, options = {}) {
    if (!blueprint) {
      throw new Error("ElephantBlueprintAdapter requires a SpeciesBlueprint");
    }

    const parityMode = options.zooParity !== undefined ? options.zooParity : this.zooParityDefault;
    const base = this.quadrupedAdapter.adapt(blueprint);

    const canonicalSkeleton = definitionToSkeleton(parityMode, base.canonicalSkeleton);
    const canonicalChains = definitionChainsToList();
    const canonicalBodyParts = buildCanonicalElephantBodyParts();

    const materialsIntent = {
      ...deepClone(base.materialsIntent || {}),
      surface: {
        ...(base.materialsIntent?.surface || {}),
        useTSLElephantSkin: true,
        shaderModel: "elephant_tsl_skin",
      },
    };

    const runtimeBlueprint = deepClone(base.runtimeBlueprint || blueprint) || {};
    runtimeBlueprint.meta = { ...(runtimeBlueprint.meta || {}), zooParity: parityMode, speciesKey: ELEPHANT_SPECIES_KEY };
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

    return {
      bodyPlanType: "quadruped",
      canonicalSkeleton,
      canonicalChains,
      canonicalBodyParts,
      materialsIntent,
      locomotion: base.locomotion || {},
      runtimeBlueprint,
      validation,
      sourceMeta,
    };
  }
}

export default ElephantBlueprintAdapter;
