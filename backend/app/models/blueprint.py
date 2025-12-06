"""Pydantic models for CreatureStudio Species Blueprints.

These models are intentionally kept close to the JSON Schema in
shared/schemas/species_blueprint.schema.json and the TypeScript
types in frontend/src/types/SpeciesBlueprint.ts.
"""

from typing import Dict, List, Optional, Any

from pydantic import BaseModel, Field


class BlueprintMeta(BaseModel):
    """Metadata about a species blueprint."""

    name: str
    version: str = "1.0.0"
    author: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class BodyPlan(BaseModel):
    """High-level body plan classification and options."""

    type: str  # Expected values: "quadruped", "biped", "winged", "nopeds".
    hasTail: bool = True
    hasTrunk: bool = False
    hasWings: bool = False
    hasEars: bool = True
    symmetryMode: Optional[str] = "bilateral"
    notes: Optional[str] = None


class Bone(BaseModel):
    """Single bone in the control skeleton."""

    name: str
    parent: str
    position: List[float] = Field(
        description="XYZ position of the bone in meters.",
        min_items=3,
        max_items=3,
    )


class Skeleton(BaseModel):
    """Control skeleton for a species blueprint."""

    root: Optional[str] = None
    coordinateSystem: Optional[str] = None
    bones: List[Bone]


class Chains(BaseModel):
    """Named anatomical chains mapping to ordered lists of bone names."""

    spine: List[str] = Field(default_factory=list)
    neck: List[str] = Field(default_factory=list)
    head: List[str] = Field(default_factory=list)
    trunk: List[str] = Field(default_factory=list)
    tail: List[str] = Field(default_factory=list)
    earLeft: List[str] = Field(default_factory=list)
    earRight: List[str] = Field(default_factory=list)
    frontLegL: List[str] = Field(default_factory=list)
    frontLegR: List[str] = Field(default_factory=list)
    backLegL: List[str] = Field(default_factory=list)
    backLegR: List[str] = Field(default_factory=list)
    extraChains: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Additional chain definitions keyed by name.",
    )


class SizeProfile(BaseModel):
    """Simple size or radius profile for a bone or chain."""

    radius: Optional[float] = Field(default=None, ge=0.0)
    radiusTop: Optional[float] = Field(default=None, ge=0.0)
    radiusBottom: Optional[float] = Field(default=None, ge=0.0)
    lengthScale: Optional[float] = Field(default=None, ge=0.0)
    widthScale: Optional[float] = Field(default=None, ge=0.0)


class Sizes(BaseModel):
    """Lookup tables for radii and scale factors."""

    defaultRadius: Optional[float] = Field(default=None, ge=0.0)
    byBone: Dict[str, SizeProfile] = Field(default_factory=dict)
    byChain: Dict[str, SizeProfile] = Field(default_factory=dict)


class BodyPartRef(BaseModel):
    """Configuration for a single body part generator."""

    generator: str
    chain: str
    options: Dict[str, Any] = Field(
        default_factory=dict,
        description="Generator-specific tuning options.",
    )


class BodyPartsConfig(BaseModel):
    """Mapping from body part names to generator configuration."""

    torso: Optional[BodyPartRef] = None
    neck: Optional[BodyPartRef] = None
    head: Optional[BodyPartRef] = None
    trunk: Optional[BodyPartRef] = None
    tail: Optional[BodyPartRef] = None
    earLeft: Optional[BodyPartRef] = None
    earRight: Optional[BodyPartRef] = None
    frontLegL: Optional[BodyPartRef] = None
    frontLegR: Optional[BodyPartRef] = None
    backLegL: Optional[BodyPartRef] = None
    backLegR: Optional[BodyPartRef] = None
    extraParts: Dict[str, BodyPartRef] = Field(
        default_factory=dict,
        description="Additional body parts keyed by name.",
    )


class MaterialDefinition(BaseModel):
    """Simple material definition compatible with Zoo surface settings."""

    color: Optional[str] = None
    roughness: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    metallic: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    specular: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    emissive: Optional[str] = None


class MaterialsConfig(BaseModel):
    """Material configuration for an animal."""

    surface: Optional[MaterialDefinition] = None
    eye: Optional[MaterialDefinition] = None
    tusk: Optional[MaterialDefinition] = None
    nail: Optional[MaterialDefinition] = None
    extraMaterials: Dict[str, MaterialDefinition] = Field(
        default_factory=dict,
        description="Additional named material presets.",
    )


class BehaviorPresets(BaseModel):
    """High-level behavior presets for an animal."""

    gait: Optional[str] = None
    idleBehaviors: List[str] = Field(default_factory=list)
    specialInteractions: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class SpeciesBlueprint(BaseModel):
    """Top-level species blueprint model used for validation and tooling."""

    meta: BlueprintMeta
    bodyPlan: BodyPlan
    skeleton: Skeleton
    chains: Chains
    sizes: Sizes
    bodyParts: BodyPartsConfig
    materials: MaterialsConfig
    behaviorPresets: BehaviorPresets
