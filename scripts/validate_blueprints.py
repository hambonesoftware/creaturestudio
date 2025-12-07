"""Blueprint validation helper for CreatureStudio.

Usage:
    python scripts/validate_blueprints.py --dir shared/blueprints

Validates each JSON blueprint file against the Pydantic SpeciesBlueprint
model and performs extra structural checks:
- bodyParts.*.chain must exist in the blueprint's chains map
- chains.* entries must reference valid bones
- generator values must match the anatomy library
- numeric options must be non-negative and sides >= 3 when present
- behaviorPresets.gait should map to a known behavior registry entry

Exits with code 1 if any blueprint fails validation.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

ROOT = Path(__file__).resolve().parent.parent
BACKEND_PATH = ROOT / "backend"
sys.path.insert(0, str(BACKEND_PATH))

try:
    from app.models.blueprint import SpeciesBlueprint
except Exception as exc:  # pragma: no cover - defensive import guard
    raise SystemExit(f"Failed to import SpeciesBlueprint: {exc}")


KNOWN_GENERATORS = {
    "torso",
    "neck",
    "head",
    "tail",
    "nose",
    "trunk",
    "limb",
    "ear",
}

KNOWN_BEHAVIORS = {
    "elephant_default",
    "quadruped_walk",
    "none",
}


class ValidationError:
    def __init__(self, message: str):
        self.message = message

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.message


class BlueprintValidationResult:
    def __init__(self, path: Path):
        self.path = path
        self.errors: List[ValidationError] = []

    @property
    def ok(self) -> bool:
        return len(self.errors) == 0

    def add(self, message: str) -> None:
        self.errors.append(ValidationError(message))


def _load_blueprint(path: Path) -> Tuple[Dict, SpeciesBlueprint | None]:
    try:
        data = json.loads(path.read_text())
    except Exception:
        return {}, None

    try:
        blueprint = SpeciesBlueprint.model_validate(data)
    except Exception:
        return data, None

    return data, blueprint


def _validate_chain_bones(result: BlueprintValidationResult, blueprint: Dict) -> None:
    skeleton = blueprint.get("skeleton", {})
    bones = skeleton.get("bones", []) or []
    bone_names = {b.get("name") for b in bones if isinstance(b, dict)}
    chains = blueprint.get("chains", {}) or {}

    for chain_name, entries in chains.items():
        if chain_name == "extraChains" and isinstance(entries, dict):
            for extra_name, extra_entries in entries.items():
                _validate_chain_bones(result, {"skeleton": skeleton, "chains": {extra_name: extra_entries}})
            continue
        if not isinstance(entries, list):
            result.add(f"Chain '{chain_name}' must be a list of bone names")
            continue
        for bone_name in entries:
            if bone_name not in bone_names:
                result.add(
                    f"Chain '{chain_name}' references unknown bone '{bone_name}'"
                )


def _validate_body_parts(result: BlueprintValidationResult, blueprint: Dict) -> None:
    chains = blueprint.get("chains", {}) or {}
    chain_names = set(chains.keys())
    if isinstance(chains.get("extraChains"), dict):
        chain_names.update(chains["extraChains"].keys())
    body_parts = blueprint.get("bodyParts", {}) or {}
    isolate = blueprint.get("debug", {}).get("isolatePart")  # unused but reserved

    for part_name, part_def in body_parts.items():
        if part_name == "extraParts" and isinstance(part_def, dict):
            for extra_name, extra_def in part_def.items():
                _validate_body_parts(result, {"chains": chains, "bodyParts": {extra_name: extra_def}})
            continue
        if not isinstance(part_def, dict):
            result.add(f"Body part '{part_name}' must be an object")
            continue

        chain_name = part_def.get("chain")
        generator = part_def.get("generator")

        if chain_name is None:
            result.add(f"Body part '{part_name}' is missing a chain reference")
        elif chain_name not in chain_names:
            result.add(
                f"Body part '{part_name}' chain '{chain_name}' not found in chains map"
            )

        if generator is None:
            result.add(f"Body part '{part_name}' is missing a generator")
        elif generator not in KNOWN_GENERATORS:
            result.add(
                f"Body part '{part_name}' uses unknown generator '{generator}'"
            )

        _validate_numeric_options(result, part_name, part_def.get("options", {}))

    if isolate and isolate not in body_parts:
        result.add(f"debug.isolatePart references unknown body part '{isolate}'")


def _validate_numeric_options(result: BlueprintValidationResult, part_name: str, options: Dict) -> None:
    if not isinstance(options, dict):
        return

    def ensure_positive_list(name: str, values: Iterable) -> None:
        for idx, val in enumerate(values):
            if isinstance(val, (int, float)) and val >= 0:
                continue
            result.add(
                f"Body part '{part_name}' option '{name}' index {idx} must be a non-negative number"
            )

    if "radii" in options and isinstance(options["radii"], list):
        ensure_positive_list("radii", options["radii"])

    for field in [
        "radius",
        "radiusTop",
        "radiusBottom",
        "baseRadius",
        "midRadius",
        "tipRadius",
        "flatten",
        "yOffset",
        "rumpBulgeDepth",
        "extraMargin",
        "lengthScale",
        "lowPolyWeldTolerance",
    ]:
        if field in options:
            value = options[field]
            if not isinstance(value, (int, float)) or value < 0:
                result.add(
                    f"Body part '{part_name}' option '{field}' must be a non-negative number"
                )

    if "sides" in options:
        sides = options["sides"]
        if not isinstance(sides, (int, float)) or sides < 3:
            result.add(f"Body part '{part_name}' option 'sides' must be >= 3")


def _validate_behaviors(result: BlueprintValidationResult, blueprint: Dict) -> None:
    behavior = blueprint.get("behaviorPresets", {}) or {}
    gait = behavior.get("gait") or "none"
    if gait not in KNOWN_BEHAVIORS:
        result.add(
            f"Behavior gait '{gait}' is not in the behavior registry ({sorted(KNOWN_BEHAVIORS)})"
        )


def validate_blueprint(path: Path) -> BlueprintValidationResult:
    result = BlueprintValidationResult(path)
    raw, model = _load_blueprint(path)

    if model is None:
        result.add("Pydantic validation failed; see schema for details")
        return result

    _validate_chain_bones(result, raw)
    _validate_body_parts(result, raw)
    _validate_behaviors(result, raw)

    return result


def iter_blueprint_files(directory: Path) -> Iterable[Path]:
    for path in directory.glob("*.json"):
        if path.is_file():
            yield path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dir",
        type=Path,
        default=ROOT / "shared" / "blueprints",
        help="Directory containing blueprint JSON files",
    )
    args = parser.parse_args()

    directory = args.dir
    if not directory.exists():
        print(f"Blueprint directory does not exist: {directory}")
        return 1

    failures = 0
    for path in sorted(iter_blueprint_files(directory)):
        result = validate_blueprint(path)
        if result.ok:
            print(f"[OK] {path}")
            continue

        failures += 1
        print(f"[FAIL] {path}")
        for err in result.errors:
            print(f"  - {err}")

    if failures:
        print(f"Validation failed for {failures} blueprint(s)")
        return 1

    print("All blueprints are valid")
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry
    raise SystemExit(main())
