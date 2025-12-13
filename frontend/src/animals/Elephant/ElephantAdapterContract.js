import { ElephantDefinition } from "./ElephantDefinition.js";

export const ELEPHANT_SPECIES_KEY = "elephant";

function deepClone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

export function buildCanonicalElephantSkeleton(parityMode, baseSkeleton) {
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

export function buildCanonicalElephantChains() {
  const chains = ElephantDefinition.chains || {};
  return Object.keys(chains)
    .map((name) => ({ name, bones: Array.isArray(chains[name]) ? [...chains[name]] : [] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const ELEPHANT_BODY_PARTS = [
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

export function buildCanonicalElephantBodyParts() {
  return ELEPHANT_BODY_PARTS.map((part) => ({
    name: part.name,
    generator: part.generator,
    chain: part.chain,
    options: deepClone(part.options),
  }));
}

export const ELEPHANT_MATERIAL_INTENT = {
  surface: { useTSLElephantSkin: true, shaderModel: "elephant_tsl_skin" },
};

export function mergeElephantMaterialsIntent(baseIntent = {}) {
  return {
    ...deepClone(baseIntent),
    surface: { ...(baseIntent.surface || {}), ...(ELEPHANT_MATERIAL_INTENT.surface || {}) },
  };
}

export function buildElephantContractSnapshot({ parityMode, baseSkeleton } = {}) {
  const canonicalSkeleton = buildCanonicalElephantSkeleton(parityMode, baseSkeleton);
  const canonicalChains = buildCanonicalElephantChains();
  const canonicalBodyParts = buildCanonicalElephantBodyParts();

  return {
    species: ELEPHANT_SPECIES_KEY,
    canonicalDefinition: ElephantDefinition,
    canonicalSkeleton,
    canonicalChains,
    canonicalBodyParts,
    materialsIntent: ELEPHANT_MATERIAL_INTENT,
  };
}

export default {
  ELEPHANT_SPECIES_KEY,
  ELEPHANT_BODY_PARTS,
  ELEPHANT_MATERIAL_INTENT,
  buildElephantContractSnapshot,
  buildCanonicalElephantSkeleton,
  buildCanonicalElephantChains,
  buildCanonicalElephantBodyParts,
  mergeElephantMaterialsIntent,
};
