/**
 * Type definitions for CreatureStudio Species Blueprints.
 * These mirror the JSON Schema in shared/schemas/species_blueprint.schema.json
 * and the Pydantic models in backend/app/models/blueprint.py.
 */

export interface BlueprintMeta {
  name: string;
  version: string;
  schemaVersion?: string;
  author?: string;
  source?: string;
  notes?: string;
}

export type BodyPlanType = "quadruped" | "biped" | "winged" | "nopeds";

export type SymmetryMode = "bilateral" | "radial" | "none";

export interface BodyPlan {
  type: BodyPlanType;
  hasTail?: boolean;
  hasTrunk?: boolean;
  hasWings?: boolean;
  hasEars?: boolean;
  symmetryMode?: SymmetryMode;
  notes?: string;
}

export interface Bone {
  name: string;
  parent: string;
  position: [number, number, number];
}

export interface BlueprintSkeleton {
  root?: string;
  coordinateSystem?: string;
  bones: Bone[];
}

export interface BlueprintChains {
  spine?: string[];
  neck?: string[];
  head?: string[];
  trunk?: string[];
  tail?: string[];
  earLeft?: string[];
  earRight?: string[];
  frontLegL?: string[];
  frontLegR?: string[];
  backLegL?: string[];
  backLegR?: string[];
  [key: string]: string[] | undefined;
}

export interface SizeProfile {
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  lengthScale?: number;
  widthScale?: number;
}

export interface SizesLookup {
  defaultRadius?: number;
  byBone?: Record<string, SizeProfile>;
  byChain?: Record<string, SizeProfile>;
}

export interface LimbOptions {
  radii?: number[];
  sides?: number;
  capStart?: boolean;
  capEnd?: boolean;
}

export interface NeckOptions {
  radii?: number[];
  sides?: number;
  yOffset?: number;
  capBase?: boolean;
  capEnd?: boolean;
}

export interface HeadOptions {
  parentBone?: string;
  radius?: number;
  sides?: number;
  elongation?: number;
}

export interface RumpExtensionOptions {
  bones?: string[];
  extraMargin?: number;
  boneRadii?: Record<string, number>;
}

export interface TorsoOptions {
  radii?: number[];
  sides?: number;
  radiusProfile?: string;
  rumpBulgeDepth?: number;
  extendRumpToRearLegs?: RumpExtensionOptions;
  capStart?: boolean;
  capEnd?: boolean;
  lowPoly?: boolean;
  lowPolySegments?: number;
  lowPolyWeldTolerance?: number;
}

export interface NoseOptions {
  radii?: number[];
  baseRadius?: number;
  midRadius?: number;
  tipRadius?: number;
  sides?: number;
  capStart?: boolean;
  capEnd?: boolean;
  lengthScale?: number;
  rootBone?: string;
}

export interface TailOptions {
  radii?: number[];
  baseRadius?: number;
  tipRadius?: number;
  sides?: number;
  capStart?: boolean;
  capEnd?: boolean;
}

export interface EarOptions {
  radii?: number[];
  sides?: number;
  flatten?: number;
  tilt?: number;
}

export type BodyPartOptions =
  | TorsoOptions
  | NeckOptions
  | HeadOptions
  | NoseOptions
  | TailOptions
  | EarOptions
  | LimbOptions
  | Record<string, unknown>;

export interface BodyPartRef {
  generator: string;
  chain: string;
  options?: BodyPartOptions;
}

export interface BodyPartsConfig {
  torso?: BodyPartRef;
  neck?: BodyPartRef;
  head?: BodyPartRef;
  trunk?: BodyPartRef;
  tail?: BodyPartRef;
  earLeft?: BodyPartRef;
  earRight?: BodyPartRef;
  frontLegL?: BodyPartRef;
  frontLegR?: BodyPartRef;
  backLegL?: BodyPartRef;
  backLegR?: BodyPartRef;
  [key: string]: BodyPartRef | undefined;
}

/**
 * Generalised chain definition used by the anatomy V2 pipeline.
 *
 * ChainsV2 decouple chain names from fixed schema keys and allow blueprint
 * authors to specify arbitrary chains. Radii, profile and extendTo are
 * optional and may be omitted if not needed. See docs/anatomy_design_v2.md
 * for guidance on how these fields are used.
 */
export interface ChainDefinition {
  /** Unique name of this chain. */
  name: string;
  /** Ordered list of bone names composing this chain. */
  bones: string[];
  /** Optional radii samples; length may equal bones length or one greater. */
  radii?: number[];
  /** Optional profile identifier applied along this chain. */
  profile?: string;
  /** Optional rump/extension configuration. */
  extendTo?:
    | boolean
    | {
        bones?: string[];
        extraMargin?: number;
        boneRadii?: Record<string, number>;
      };
}

/**
 * Generalised body part definition used by the anatomy V2 pipeline.
 *
 * Each body part definition assigns a generator to a named chain and
 * supplies generator-specific options. The name is descriptive and
 * does not need to match the chain name.
 */
export interface BodyPartDefinition {
  /** Descriptive name of this body part. */
  name: string;
  /** Key identifying which generator to invoke (e.g. 'torsoGenerator', 'limbGenerator'). */
  generator: string;
  /** Name of the chain this body part uses (must match a ChainDefinition name). */
  chain: string;
  /** Optional generator-specific options. */
  options?: BodyPartOptions;
}

export interface MaterialDefinition {
  color?: string;
  roughness?: number;
  metallic?: number;
  specular?: number;
  emissive?: string;
}

export interface MaterialsConfig {
  surface?: MaterialDefinition;
  eye?: MaterialDefinition;
  tusk?: MaterialDefinition;
  nail?: MaterialDefinition;
  [key: string]: MaterialDefinition | undefined;
}

export interface BehaviorPresets {
  gait?: string;
  idleBehaviors?: string[];
  specialInteractions?: string[];
  tags?: string[];
}

export interface SpeciesBlueprint {
  meta: BlueprintMeta;
  bodyPlan: BodyPlan;
  skeleton: BlueprintSkeleton;
  /**
   * Deprecated: old-style chain definitions mapping fixed names to bone lists.
   * Use chainsV2 instead for new anatomy pipeline. This field is optional
   * to support backwards compatibility when loading legacy blueprints.
   */
  chains?: BlueprintChains;
  sizes: SizesLookup;
  /**
   * Deprecated: old-style body parts mapping keyed by fixed names. Use
   * bodyPartsV2 instead for the anatomy V2 pipeline. Optional for backwards
   * compatibility.
   */
  bodyParts?: BodyPartsConfig;
  /**
   * Generalised chain definitions for the anatomy V2 pipeline. Each entry
   * describes a chain by name and its ordered bones along with optional
   * radii, profile and extendTo fields.
   */
  chainsV2?: ChainDefinition[];
  /**
   * Generalised body part definitions for the anatomy V2 pipeline. Each
   * body part references a chain name, specifies the generator key and
   * provides generator-specific options.
   */
  bodyPartsV2?: BodyPartDefinition[];
  materials: MaterialsConfig;
  behaviorPresets: BehaviorPresets;
}
