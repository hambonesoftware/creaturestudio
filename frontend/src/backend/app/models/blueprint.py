"""Pydantic models for CreatureStudio Species Blueprints.

These models are intentionally kept close to the JSON Schema in
shared/schemas/species_blueprint.schema.json and the TypeScript
types in frontend/src/types/SpeciesBlueprint.ts.
"""

from typing import Dict, List, Optional, Any, Union

from pydantic import BaseModel, Field, model_validator


class BlueprintMeta(BaseModel):
    """Metadata about a species blueprint."""

    name: str
    version: str = "1.0.0"
    schemaVersion: str = Field(
        default="4.2.0",
        description=(
            "Semantic version of the blueprint schema. Keep in sync with "
            "frontend types and JSON schema."
        ),
    )
    author: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    forceLegacyBuild: bool = Field(
        default=False,
        description=(
            "Temporary escape hatch to force legacy body-part builders when"
            " anatomy V2 data is incomplete."
        ),
    )


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


class ChainDefinition(BaseModel):
    """
    Generalised chain definition used by the anatomy V2 pipeline.

    A chain definition names a chain and lists the ordered bone names that make
    up that chain.  Optional fields provide radius samples, a profile key and
    extension behaviour for rump/wing membranes.  Radii and options should be
    supplied via body part options when possible; they are included here to
    support blueprint authors who wish to store radii with the chain itself.
    """

    name: str = Field(description="Unique name of this chain.")
    bones: List[str] = Field(description="Ordered list of bone names.")
    radii: Optional[List[float]] = Field(
        default=None,
        description="Optional per-bone radii samples. Length may be equal to number of bones or one greater.",
    )
    profile: Optional[str] = Field(
        default=None,
        description="Optional profile identifier to apply along this chain.",
    )
    extendTo: Optional[Union[bool, Dict[str, Any]]] = Field(
        default=None,
        description="Optional rump/extension configuration. True enables default behaviour; an object can specify bones, extraMargin and boneRadii.",
    )


class BodyPartDefinition(BaseModel):
    """
    Generalised body part definition used by the anatomy V2 pipeline.

    Each body part definition assigns a generator to a named chain and
    provides generator-specific options.  The name field is purely
    descriptive and need not match the chain name.
    """

    name: str = Field(description="Descriptive name of this body part.")
    generator: str = Field(
        description="Key identifying which generator to invoke (e.g. 'torsoGenerator', 'limbGenerator', 'wingGenerator')."
    )
    chain: str = Field(
        description="Name of the chain this body part uses (must match a ChainDefinition name)."
    )
    options: BodyPartOptions = Field(
        default_factory=dict,
        description="Generator-specific tuning options.",
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


class LimbOptionsModel(BaseModel):
    """General limb options (legs, tusks, ear bases)."""

    radii: List[float] = Field(
        default_factory=list,
        description="Radius samples along the limb, one entry per bone with repeat for remainder.",
    )
    sides: int = Field(default=16, ge=3, description="Number of radial segments.")
    capStart: bool = True
    capEnd: bool = True


class NeckOptionsModel(BaseModel):
    """Options for a neck segment between torso and head."""

    radii: List[float] = Field(default_factory=list)
    sides: int = Field(default=18, ge=3)
    yOffset: float = Field(default=0.0, description="Vertical offset applied to all neck points.")
    capBase: bool = True
    capEnd: bool = True


class HeadOptionsModel(BaseModel):
    """Spherical/ellipsoid head options."""

    parentBone: str = Field(default="head")
    radius: float = Field(default=0.6, ge=0.0)
    sides: int = Field(default=22, ge=3)
    elongation: float = Field(default=1.0, ge=0.0)


class RumpExtensionModel(BaseModel):
    """Optional rump expansion to overlap the rear legs."""

    bones: List[str] = Field(default_factory=list)
    extraMargin: float = Field(default=0.0, ge=0.0)
    boneRadii: Dict[str, float] = Field(default_factory=dict)


class TorsoOptionsModel(BaseModel):
    """Torso options including rump bulge and leg overlap."""

    radii: List[float] = Field(default_factory=list)
    sides: int = Field(default=28, ge=3)
    radiusProfile: Optional[str] = Field(
        default=None,
        description="Named radius profile to apply along the torso (e.g., 'elephant_heavy').",
    )
    rumpBulgeDepth: float = Field(
        default=0.0,
        description="Depth of the rump bulge in meters; 0 disables the bulge.",
    )
    extendRumpToRearLegs: Optional[RumpExtensionModel] = Field(default=None)
    capStart: bool = True
    capEnd: bool = True
    lowPoly: bool = False
    lowPolySegments: int = Field(default=9, ge=3)
    lowPolyWeldTolerance: float = Field(default=0.0, ge=0.0)


class NoseOptionsModel(BaseModel):
    """Nose/trunk/tusk options."""

    radii: List[float] = Field(default_factory=list)
    baseRadius: float = Field(default=0.2, ge=0.0)
    midRadius: Optional[float] = Field(default=None, ge=0.0)
    tipRadius: float = Field(default=0.1, ge=0.0)
    sides: int = Field(default=16, ge=3)
    capStart: bool = True
    capEnd: bool = True
    lengthScale: float = Field(default=1.0, ge=0.0)
    rootBone: Optional[str] = Field(default=None)


class TailOptionsModel(BaseModel):
    """Tail options for tapered tails."""

    radii: List[float] = Field(default_factory=list)
    baseRadius: float = Field(default=0.12, ge=0.0)
    tipRadius: float = Field(default=0.05, ge=0.0)
    sides: int = Field(default=14, ge=3)
    capStart: bool = True
    capEnd: bool = True


class EarOptionsModel(BaseModel):
    """Ear flap options built from limb geometry then flattened."""

    radii: List[float] = Field(default_factory=list)
    sides: int = Field(default=16, ge=3)
    flatten: float = Field(default=0.2, ge=0.0)
    tilt: float = Field(default=0.0, description="Radians to tilt the ear about Z.")


BodyPartOptions = Union[
    TorsoOptionsModel,
    NeckOptionsModel,
    HeadOptionsModel,
    NoseOptionsModel,
    TailOptionsModel,
    EarOptionsModel,
    LimbOptionsModel,
    Dict[str, Any],
]


class BodyPartRef(BaseModel):
    """Configuration for a single body part generator."""

    generator: str
    chain: str
    options: BodyPartOptions = Field(
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
    chains: Optional[Chains] = Field(
        default=None,
        description="Deprecated: old-style chain definitions mapping names to bone lists. Use chainsV2 instead."
    )
    sizes: Sizes
    bodyParts: Optional[BodyPartsConfig] = Field(
        default=None,
        description="Deprecated: old-style body parts mapping. Use bodyPartsV2 instead."
    )
    chainsV2: List[ChainDefinition] = Field(
        default_factory=list,
        description="Generalised chain definitions for the anatomy V2 pipeline."
    )
    bodyPartsV2: List[BodyPartDefinition] = Field(
        default_factory=list,
        description="Generalised body part definitions for the anatomy V2 pipeline."
    )
    materials: MaterialsConfig
    behaviorPresets: BehaviorPresets

    @model_validator(mode="after")
    def validate_chains_and_bodyparts(self):
        """Ensure chains/bodyParts mappings are coherent for anatomy V2."""

        chain_names = {c.name for c in self.chainsV2}
        if self.bodyPartsV2 and not chain_names:
            raise ValueError("chainsV2 must be provided when bodyPartsV2 are defined")

        # Validate that chain bones exist in the skeleton
        skeleton_bones = {b.name for b in self.skeleton.bones}
        for chain in self.chainsV2:
            missing_bones = [bone for bone in chain.bones if bone not in skeleton_bones]
            if missing_bones:
                raise ValueError(
                    f"Chain '{chain.name}' references missing bones: {', '.join(missing_bones)}"
                )

        # Validate body part -> chain mapping
        for part in self.bodyPartsV2:
            if part.chain not in chain_names:
                raise ValueError(
                    f"Body part '{part.name}' targets unknown chain '{part.chain}'. "
                    f"Known chains: {', '.join(sorted(chain_names)) or 'none'}"
                )
            options = getattr(part, "options", {}) or {}
            if isinstance(options, dict):
                additional = options.get("additionalChains") or []
                missing_additional = [name for name in additional if name not in chain_names]
                if missing_additional:
                    raise ValueError(
                        "Body part '"
                        + part.name
                        + "' references unknown additionalChains: "
                        + ", ".join(missing_additional)
                    )

        return self
