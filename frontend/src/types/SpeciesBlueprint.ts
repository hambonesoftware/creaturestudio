/**
 * Type definitions for CreatureStudio Species Blueprints.
 * These mirror the JSON Schema in shared/schemas/species_blueprint.schema.json
 * and the Pydantic models in backend/app/models/blueprint.py.
 */

export interface BlueprintMeta {
  name: string;
  version: string;
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

export interface BodyPartRef {
  generator: string;
  chain: string;
  options?: Record<string, unknown>;
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
  chains: BlueprintChains;
  sizes: SizesLookup;
  bodyParts: BodyPartsConfig;
  materials: MaterialsConfig;
  behaviorPresets: BehaviorPresets;
}
