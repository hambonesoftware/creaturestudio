"""Services for exporting Species Blueprints as Zoo-style animal bundles.

Phase 5 converts the export surface to **data-only bundles** that match the
``docs/export_contract_v1.md`` layout:

```
manifest.json
AnimalDefinition.json
materials.json
runtime.json        (optional)
blueprint.json      (optional)
assets/
```

Exports contain stable JSON suitable for Zoo and other Zoo-style renderers.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

from app.config import Settings, get_settings
from app.models.blueprint import BodyPartDefinition, BodyPartsConfig, Chains, SpeciesBlueprint


def _safe_animal_name(name: str) -> str:
    """Return a filesystem-safe version of *name*.

    This is intentionally conservative and strips any character that is
    not an ASCII alphanumeric or underscore.
    """
    return re.sub(r"[^A-Za-z0-9_]", "", name)


CONTRACT_VERSION = "1.0.0"
DEFAULT_MIN_ZOO_VERSION = "0.1.0"


def _compute_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _serializable_body_part_options(options: Any) -> Any:
    """Convert body part options into JSON-serializable data."""

    if hasattr(options, "model_dump"):
        return options.model_dump()
    if hasattr(options, "dict"):
        return options.dict()
    return options


def _material_slot_from_definition(
    name: str, definition: Any, force_node_tsl: bool = False
) -> Dict[str, Any]:
    parameters: Dict[str, Any] = {}
    if getattr(definition, "color", None):
        parameters["color"] = definition.color
    if getattr(definition, "roughness", None) is not None:
        parameters["roughness"] = definition.roughness
    if getattr(definition, "metallic", None) is not None:
        parameters["metallic"] = definition.metallic
    if getattr(definition, "specular", None) is not None:
        parameters["specular"] = definition.specular
    if getattr(definition, "emissive", None):
        parameters["emissive"] = definition.emissive

    workflow = "pbr"
    node_graph: Dict[str, Any] | None = None

    # Heuristic: trunked quadrupeds (elephants) should signal the node/TSL path.
    if force_node_tsl:
        workflow = "node/tsl"
        node_graph = {
            "graph": "elephantSkinTSL",
            "parameters": {
                "albedoTint": parameters.get("color", "#7a6f63"),
                "roughness": parameters.get("roughness", 0.78),
                "displacement": 0.02,
            },
        }

    slot = {
        "slot": name,
        "type": name,
        "workflow": workflow,
        "parameters": parameters,
    }

    if node_graph:
        slot["nodeGraph"] = node_graph
        slot["useTSLSkin"] = True

    return slot


def _material_slots(blueprint: SpeciesBlueprint) -> List[Dict[str, Any]]:
    materials = blueprint.materials
    slots: List[Dict[str, Any]] = []
    animal_is_elephant = blueprint.bodyPlan.hasTrunk or "elephant" in blueprint.meta.name.lower()

    if materials.surface:
        slots.append(
            _material_slot_from_definition(
                "surface", materials.surface, force_node_tsl=animal_is_elephant
            )
        )
    if materials.eye:
        slots.append(
            _material_slot_from_definition(
                "eye", materials.eye, force_node_tsl=False
            )
        )
    if materials.tusk:
        slots.append(
            _material_slot_from_definition(
                "tusk", materials.tusk, force_node_tsl=False
            )
        )
    if materials.nail:
        slots.append(
            _material_slot_from_definition(
                "nail", materials.nail, force_node_tsl=False
            )
        )

    for key, definition in materials.extraMaterials.items():
        slots.append(
            _material_slot_from_definition(
                key, definition, force_node_tsl=animal_is_elephant
            )
        )

    return slots


def _body_parts_from_v2(definitions: List[BodyPartDefinition]) -> List[Dict[str, Any]]:
    parts: List[Dict[str, Any]] = []
    for definition in definitions:
        parts.append(
            {
                "name": definition.name,
                "generator": definition.generator,
                "chain": definition.chain,
                "options": _serializable_body_part_options(definition.options),
            }
        )
    return parts


def _body_parts_from_v1(config: BodyPartsConfig) -> List[Dict[str, Any]]:
    parts: List[Dict[str, Any]] = []
    for key in [
        "torso",
        "neck",
        "head",
        "trunk",
        "tail",
        "earLeft",
        "earRight",
        "frontLegL",
        "frontLegR",
        "backLegL",
        "backLegR",
    ]:
        ref = getattr(config, key)
        if ref:
            parts.append(
                {
                    "name": key,
                    "generator": ref.generator,
                    "chain": ref.chain,
                    "options": _serializable_body_part_options(ref.options),
                }
            )
    for name, ref in config.extraParts.items():
        parts.append(
            {
                "name": name,
                "generator": ref.generator,
                "chain": ref.chain,
                "options": _serializable_body_part_options(ref.options),
            }
        )
    return parts


def _animal_definition_payload(
    blueprint: SpeciesBlueprint, animal_safe: str, schema_version: str
) -> Dict[str, Any]:
    skeleton = [
        {
            "name": bone.name,
            "parent": bone.parent or None,
            "restTransform": {
                "position": bone.position,
                "rotation": [0.0, 0.0, 0.0],
                "scale": [1.0, 1.0, 1.0],
            },
        }
        for bone in blueprint.skeleton.bones
    ]

    if blueprint.bodyPartsV2:
        parts = _body_parts_from_v2(blueprint.bodyPartsV2)
    elif blueprint.bodyParts:
        parts = _body_parts_from_v1(blueprint.bodyParts)
    else:
        parts = []

    chains: Chains | None = None
    if blueprint.chains:
        chains = blueprint.chains

    definition: Dict[str, Any] = {
        "contractVersion": CONTRACT_VERSION,
        "schemaVersion": schema_version,
        "minZooVersion": DEFAULT_MIN_ZOO_VERSION,
        "speciesKey": animal_safe,
        "displayName": blueprint.meta.name,
        "skeleton": skeleton,
        "parts": parts,
        "materials": _material_slots(blueprint),
    }

    if chains:
        definition["chains"] = chains.dict()

    return definition


def _materials_payload(blueprint: SpeciesBlueprint, schema_version: str) -> Dict[str, Any]:
    payload = {
        "contractVersion": CONTRACT_VERSION,
        "schemaVersion": schema_version,
        "minZooVersion": DEFAULT_MIN_ZOO_VERSION,
        "slots": _material_slots(blueprint),
        "textures": {},
    }
    return payload


def _runtime_payload(blueprint: SpeciesBlueprint, schema_version: str) -> Dict[str, Any]:
    locomotion: Dict[str, Any] = {}
    behavior: Dict[str, Any] = {}

    if blueprint.behaviorPresets.gait:
        locomotion["gait"] = blueprint.behaviorPresets.gait
    if blueprint.behaviorPresets.idleBehaviors:
        behavior["idleBehaviors"] = blueprint.behaviorPresets.idleBehaviors
    if blueprint.behaviorPresets.specialInteractions:
        behavior["specialInteractions"] = blueprint.behaviorPresets.specialInteractions

    payload: Dict[str, Any] = {
        "contractVersion": CONTRACT_VERSION,
        "schemaVersion": schema_version,
        "minZooVersion": DEFAULT_MIN_ZOO_VERSION,
    }

    if locomotion:
        payload["locomotion"] = locomotion
    if behavior:
        payload["behavior"] = behavior

    return payload


def _manifest_payload(
    version: str,
    animal_name: str,
    schema_version: str,
    checksums: Dict[str, str],
) -> Dict[str, Any]:
    return {
        "contractVersion": CONTRACT_VERSION,
        "schemaVersion": schema_version,
        "minZooVersion": DEFAULT_MIN_ZOO_VERSION,
        "tooling": {
            "app": "CreatureStudio",
            "version": version,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "animal": {
            "speciesKey": animal_name,
            "displayName": animal_name,
        },
        "payloads": checksums,
    }


def export_animal(
    blueprint: SpeciesBlueprint,
    version: str,
    config: Settings | None = None,
) -> Path:
    """Export *blueprint* as a Zoo-style animal bundle.

    Parameters
    ----------
    blueprint:
        The :class:`SpeciesBlueprint` instance to export.
    version:
        Semantic version string for the export, e.g. ``"4.1.0"``.
    config:
        Optional :class:`Settings` instance. When omitted, the global
        :func:`get_settings` helper is used.

    Returns
    -------
    Path
        The path to the created ``*.zip`` archive.
    """
    settings = config or get_settings()
    exports_root = settings.exports_dir
    exports_root.mkdir(parents=True, exist_ok=True)

    animal_safe = _safe_animal_name(blueprint.meta.name)
    bundle_name = f"{animal_safe}V{version}"

    staging_dir = exports_root / bundle_name
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True, exist_ok=True)

    schema_version = blueprint.meta.schemaVersion

    definition_payload = _animal_definition_payload(
        blueprint, animal_safe, schema_version
    )
    materials_payload = _materials_payload(blueprint, schema_version)
    runtime_payload = _runtime_payload(blueprint, schema_version)

    payload_paths = {
        "AnimalDefinition.json": definition_payload,
        "materials.json": materials_payload,
        "runtime.json": runtime_payload,
    }

    # Optional traceability: include the source blueprint under both a generic
    # name and the species-specific blueprint filename Zoo expects.
    try:
        blueprint_payload = blueprint.model_dump()
    except AttributeError:
        blueprint_payload = blueprint.dict()
    payload_paths["blueprint.json"] = blueprint_payload
    payload_paths[f"{blueprint.meta.name}Blueprint.json"] = blueprint_payload

    checksums: Dict[str, str] = {}
    for filename, payload in payload_paths.items():
        target_path = staging_dir / filename
        target_path.write_text(
            json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8"
        )
        checksums[filename] = _compute_sha256(target_path)

    # Include Zoo reference JS assets when available so the bundle is
    # immediately portable back into Zoo.
    reference_dir = settings.base_dir / "zoo_reference" / blueprint.meta.name
    if reference_dir.is_dir():
        for asset in reference_dir.iterdir():
            if asset.is_file():
                target_path = staging_dir / asset.name
                shutil.copy2(asset, target_path)
                checksums[asset.name] = _compute_sha256(target_path)

    manifest = _manifest_payload(
        version=version,
        animal_name=blueprint.meta.name,
        schema_version=schema_version,
        checksums=checksums,
    )
    manifest_path = staging_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8"
    )

    zip_path = exports_root / f"{bundle_name}.zip"
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in staging_dir.rglob("*"):
            if path.is_file():
                arcname = path.relative_to(staging_dir)
                zf.write(path, arcname=str(arcname))

    return zip_path
