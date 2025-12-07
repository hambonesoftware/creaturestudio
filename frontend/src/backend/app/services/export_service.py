"""Services for exporting Species Blueprints as Zoo-style animal bundles.

The main entrypoint is :func:`export_animal`, which renders a set of JS
modules and a copy of the original blueprint into a directory structure
that roughly matches the existing Zoo project layout, and then zips that
directory into a distributable archive.
"""

from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path
from typing import Dict, Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import Settings, get_settings
from app.models.blueprint import SpeciesBlueprint


def _safe_animal_name(name: str) -> str:
    """Return a filesystem-safe version of *name*.

    This is intentionally conservative and strips any character that is
    not an ASCII alphanumeric or underscore.
    """
    return re.sub(r"[^A-Za-z0-9_]", "", name)


def _templates_env(templates_dir: Path) -> Environment:
    """Create a Jinja2 environment pointed at *templates_dir*."""
    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(enabled_extensions=("html", "xml")),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    # JS templates should not be auto-escaped; we only use explicit JSON
    # strings that we mark as safe.
    env.autoescape = False
    return env


def _blueprint_to_context(blueprint: SpeciesBlueprint, version: str) -> Dict[str, Any]:
    """Convert a :class:`SpeciesBlueprint` to a template context dict."""
    # Pydantic v1 vs v2 compatibility for dict export.
    try:
        blueprint_dict = blueprint.model_dump()
    except AttributeError:
        blueprint_dict = blueprint.dict()

    meta = blueprint.meta.dict()
    skeleton = blueprint.skeleton
    chains = blueprint.chains
    sizes = blueprint.sizes

    bones_array = [bone.dict() for bone in skeleton.bones]

    context: Dict[str, Any] = {
        "animalName": blueprint.meta.name,
        "animalSafeName": _safe_animal_name(blueprint.meta.name),
        "version": version,
        "blueprint": blueprint_dict,
        "meta": meta,
        "bones": bones_array,
        "chains": chains.dict(),
        "sizes": sizes.dict(),
    }

    # Pre-serialised JSON strings for direct embedding in the JS templates.
    context["blueprint_json"] = json.dumps(blueprint_dict, indent=2)
    context["meta_json"] = json.dumps(meta, indent=2)
    context["bones_json"] = json.dumps(bones_array, indent=2)
    context["chains_json"] = json.dumps(chains.dict(), indent=2)
    context["sizes_json"] = json.dumps(sizes.dict(), indent=2)

    return context


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

    animal_dir = staging_dir / animal_safe
    animal_dir.mkdir(parents=True, exist_ok=True)

    templates_dir = Path(__file__).resolve().parents[1] / "templates"
    env = _templates_env(templates_dir)

    context = _blueprint_to_context(blueprint, version)

    templates = {
        "Definition": "AnimalDefinition.js.j2",
        "Generator": "AnimalGenerator.js.j2",
        "Creature": "AnimalCreature.js.j2",
        "Behavior": "AnimalBehavior.js.j2",
        "Pen": "AnimalPen.js.j2",
    }

    for suffix, template_name in templates.items():
        template = env.get_template(template_name)
        rendered = template.render(context)
        target_path = animal_dir / f"{animal_safe}{suffix}.js"
        target_path.write_text(rendered, encoding="utf-8")

    # Also include a copy of the original blueprint JSON.
    blueprint_json_path = animal_dir / f"{animal_safe}Blueprint.json"
    try:
        blueprint_payload = blueprint.model_dump()
    except AttributeError:
        blueprint_payload = blueprint.dict()
    blueprint_json_path.write_text(
        json.dumps(blueprint_payload, indent=2), encoding="utf-8"
    )

    # Create the zip archive.
    zip_path = exports_root / f"{bundle_name}.zip"
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in staging_dir.rglob("*"):
            if path.is_file():
                arcname = path.relative_to(staging_dir)
                zf.write(path, arcname=str(arcname))

    return zip_path
