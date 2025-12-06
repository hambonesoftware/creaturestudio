"""File-based storage and validation helpers for Species Blueprints.

This module provides a thin abstraction over the JSON files stored in
``settings.blueprints_dir``. It knows how to:

* List available blueprints.
* Load a blueprint into the :class:`SpeciesBlueprint` Pydantic model.
* Save a blueprint back to disk.
* Delete a blueprint (with optional protection for canonical ones).

It is deliberately simple and avoids any database dependency so that the
CreatureStudio backend can run in a local, file-focused workflow.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import json

from pydantic import ValidationError

from app.config import get_settings, Settings
from app.models.blueprint import BlueprintMeta, SpeciesBlueprint


class BlueprintError(Exception):
    """Base class for blueprint store errors."""


class BlueprintNotFoundError(BlueprintError):
    """Raised when a requested blueprint file does not exist."""


class BlueprintValidationError(BlueprintError):
    """Raised when a blueprint fails Pydantic validation."""

    def __init__(self, message: str, *, details: str | None = None) -> None:
        super().__init__(message)
        self.details = details


class ProtectedBlueprintError(BlueprintError):
    """Raised when attempting to delete a protected blueprint."""


@dataclass
class StoredBlueprint:
    """Represents a blueprint stored on disk."""

    path: Path
    meta: BlueprintMeta

    @property
    def name(self) -> str:
        """Return the logical blueprint name."""
        return self.meta.name


def _blueprints_dir(settings: Settings | None = None) -> Path:
    """Return the directory where blueprint JSON files are stored."""
    settings = settings or get_settings()
    directory = settings.blueprints_dir
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _iter_blueprint_files(settings: Settings | None = None) -> List[Path]:
    """Return a sorted list of JSON files in the blueprints directory."""
    directory = _blueprints_dir(settings)
    return sorted(p for p in directory.glob("*.json") if p.is_file())


def _load_json_file(path: Path) -> dict:
    """Load JSON from *path* and return it as a dict."""
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise BlueprintNotFoundError(f"Blueprint file not found: {path}") from exc

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise BlueprintValidationError(
            f"Blueprint JSON is malformed: {path}", details=str(exc)
        ) from exc


def list_blueprints(settings: Settings | None = None) -> List[BlueprintMeta]:
    """Return a list of :class:`BlueprintMeta` for all blueprint JSON files.

    Each blueprint file is fully validated as a :class:`SpeciesBlueprint`
    instance and only the ``meta`` payload is returned.
    """
    metas: List[BlueprintMeta] = []
    settings = settings or get_settings()

    for path in _iter_blueprint_files(settings):
        data = _load_json_file(path)
        try:
            blueprint = SpeciesBlueprint.parse_obj(data)
        except ValidationError as exc:
            raise BlueprintValidationError(
                f"Blueprint at {path} failed validation", details=str(exc)
            ) from exc
        metas.append(blueprint.meta)

    return metas


def _resolve_name_to_path(name: str, settings: Settings | None = None) -> Path:
    """Resolve a logical blueprint *name* to a JSON file path.

    Resolution order:

    1. ``{name}.json``
    2. ``{name}Blueprint.json``
    3. Any file whose ``meta.name`` field matches *name*.
    """
    settings = settings or get_settings()
    directory = _blueprints_dir(settings)

    direct = directory / f"{name}.json"
    if direct.is_file():
        return direct

    suffixed = directory / f"{name}Blueprint.json"
    if suffixed.is_file():
        return suffixed

    # Fallback: scan all blueprints and match by meta.name
    for path in _iter_blueprint_files(settings):
        data = _load_json_file(path)
        try:
            blueprint = SpeciesBlueprint.parse_obj(data)
        except ValidationError:
            # Skip invalid files; they will be surfaced by list/load as needed.
            continue
        if blueprint.meta.name == name:
            return path

    raise BlueprintNotFoundError(f"No blueprint found for name: {name}")


def load_blueprint(name: str, settings: Settings | None = None) -> SpeciesBlueprint:
    """Load and validate a blueprint by *name*.

    The *name* is typically the high-level animal name (e.g. ``"Elephant"``).
    """
    settings = settings or get_settings()
    path = _resolve_name_to_path(name, settings)
    data = _load_json_file(path)
    try:
        return SpeciesBlueprint.parse_obj(data)
    except ValidationError as exc:
        raise BlueprintValidationError(
            f"Blueprint '{name}' at {path} failed validation", details=str(exc)
        ) from exc


def save_blueprint(
    name: str, blueprint: SpeciesBlueprint, settings: Settings | None = None
) -> Path:
    """Persist *blueprint* under the given *name* and return the file path.

    The JSON file name will be ``{name}Blueprint.json`` by default, keeping
    the naming convention used by ``ElephantBlueprint.json``.
    """
    settings = settings or get_settings()
    directory = _blueprints_dir(settings)
    path = directory / f"{name}Blueprint.json"

    # Ensure the meta.name matches the logical name for consistency.
    if blueprint.meta.name != name:
        meta = blueprint.meta.copy(update={"name": name})
        blueprint = blueprint.copy(update={"meta": meta})

    # Pydantic v1 vs v2 compatibility for dict export.
    try:
        payload = blueprint.model_dump()
    except AttributeError:
        payload = blueprint.dict()

    text = json.dumps(payload, indent=2, sort_keys=False)
    path.write_text(text, encoding="utf-8")
    return path


PROTECTED_BLUEPRINTS = {"Elephant"}


def delete_blueprint(name: str, settings: Settings | None = None) -> None:
    """Delete the blueprint for *name* unless it is protected.

    Attempting to delete a protected blueprint (such as ``"Elephant"``)
    will raise :class:`ProtectedBlueprintError`.
    """
    settings = settings or get_settings()
    if name in PROTECTED_BLUEPRINTS:
        raise ProtectedBlueprintError(f"Blueprint '{name}' is protected and "
                                      f"cannot be deleted.")

    path = _resolve_name_to_path(name, settings)
    try:
        path.unlink()
    except FileNotFoundError as exc:
        raise BlueprintNotFoundError(f"No blueprint found for name: {name}") from exc

# === Template + Import helpers (Phase 6) =====================================

TEMPLATE_FILE_MAP = {
    "quadruped": "TemplateQuadruped.json",
    "biped": "TemplateBiped.json",
    "winged": "TemplateWinged.json",
    "winged_quadruped": "TemplateWinged.json",
    "no-ped": "TemplateNoPed.json",
    "no_ped": "TemplateNoPed.json",
    "nopeds": "TemplateNoPed.json",
}


def _templates_dir(settings: Settings | None = None) -> Path:
    """
    Resolve the on-disk templates directory, creating it if necessary.

    This mirrors _blueprints_dir but uses settings.templates_dir so that
    templates stay clearly separated from user-authored blueprints.
    """
    settings = settings or get_settings()
    directory = settings.templates_dir
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def load_template_blueprint(template_type: str, settings: Settings | None = None) -> SpeciesBlueprint:
    """
    Load a template blueprint by high-level type label (quadruped, biped, etc.).

    This is intentionally forgiving about the label. It normalizes the
    template_type string and then looks it up in TEMPLATE_FILE_MAP.
    """
    settings = settings or get_settings()
    key = (template_type or "").strip().lower()
    if not key:
        raise BlueprintValidationError("templateType must be a non-empty string")

    filename = TEMPLATE_FILE_MAP.get(key)
    if filename is None:
        raise BlueprintValidationError(
            f"Unknown templateType '{template_type}'. "
            f"Expected one of: {', '.join(sorted(TEMPLATE_FILE_MAP.keys()))}."
        )

    templates_dir = _templates_dir(settings=settings)
    path = templates_dir / filename
    if not path.exists():
        raise BlueprintNotFoundError(
            f"Template blueprint file '{filename}' not found in {templates_dir}"
        )

    data = _load_json_file(path)
    try:
        blueprint = SpeciesBlueprint.parse_obj(data)
    except ValidationError as exc:
        raise BlueprintValidationError(
            f"Template blueprint '{filename}' failed validation",
            details=str(exc),
        ) from exc

    return blueprint


def create_blueprint_from_template(
    name: str,
    template_type: str,
    settings: Settings | None = None,
) -> SpeciesBlueprint:
    """
    Create a new on-disk blueprint starting from a built-in template.

    This helper:
    * loads the appropriate template blueprint
    * updates its meta.name (and leaves other metadata unchanged)
    * persists it via save_blueprint
    * returns the fully validated SpeciesBlueprint
    """
    settings = settings or get_settings()
    name = (name or "").strip()
    if not name:
        raise BlueprintValidationError("Blueprint name must be a non-empty string")

    # Guard canonical / protected names from being overwritten by accident.
    if name in PROTECTED_BLUEPRINTS:
        raise ProtectedBlueprintError(
            f"'{name}' is a protected blueprint name and cannot be used for a new template-derived species."
        )

    # If a blueprint already exists with this name, surface a clear error
    # instead of silently overwriting.
    blueprints_dir = _blueprints_dir(settings=settings)
    existing_path = blueprints_dir / f"{name}Blueprint.json"
    if existing_path.exists():
        raise BlueprintValidationError(
            f"A blueprint named '{name}' already exists. Choose a different name "
            "or delete/rename the existing species first."
        )

    template_blueprint = load_template_blueprint(template_type, settings=settings)

    # Copy and update meta.name only; everything else (chains, bodyPlan, sizes,
    # bodyParts, materials, behaviorPresets) flows from the template.
    meta = template_blueprint.meta.copy(update={"name": name})
    new_blueprint = template_blueprint.copy(update={"meta": meta})

    # Persist the blueprint to disk and return the in-memory object.
    save_blueprint(name, new_blueprint, settings=settings)
    return new_blueprint


def import_blueprint_from_bytes(
    payload: bytes,
    settings: Settings | None = None,
) -> SpeciesBlueprint:
    """
    Import a SpeciesBlueprint from raw JSON bytes.

    This helper performs:
    * UTF-8 decoding
    * JSON parsing
    * pydantic validation into SpeciesBlueprint
    * protection against overwriting canonical built-ins
    * persistence via save_blueprint
    """
    settings = settings or get_settings()

    try:
        text = payload.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise BlueprintValidationError(
            "Import payload is not valid UTF-8",
            details=str(exc),
        ) from exc

    try:
        raw = json.loads(text)
    except json.JSONDecodeError as exc:
        raise BlueprintValidationError(
            "Import payload is not valid JSON",
            details=str(exc),
        ) from exc

    try:
        blueprint = SpeciesBlueprint.parse_obj(raw)
    except ValidationError as exc:
        raise BlueprintValidationError(
            "Imported blueprint failed validation",
            details=str(exc),
        ) from exc

    name = (blueprint.meta.name or "").strip()
    if not name:
        raise BlueprintValidationError(
            "Imported blueprint must define meta.name as a non-empty string"
        )

    if name in PROTECTED_BLUEPRINTS:
        raise ProtectedBlueprintError(
            f"Imported blueprint uses protected name '{name}'. "
            "Choose a different name before importing."
        )

    # Delegate to save_blueprint for the actual file I/O and normalization.
    save_blueprint(name, blueprint, settings=settings)
    return blueprint
