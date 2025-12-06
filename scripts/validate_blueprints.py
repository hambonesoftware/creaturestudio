"""Validation helper for CreatureStudio Species Blueprints.

This script loads all JSON files in shared/blueprints and validates
them against the SpeciesBlueprint Pydantic model.

Usage:

    python scripts/validate_blueprints.py

The exit code is zero when all blueprints validate successfully
and non-zero if any blueprint fails validation.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from pydantic import ValidationError


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    blueprints_dir = project_root / "shared" / "blueprints"

    backend_dir = project_root / "backend"
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    try:
        from app.models.blueprint import SpeciesBlueprint
    except Exception as import_error:
        print("Could not import SpeciesBlueprint from app.models.blueprint.")
        print(f"Import error: {import_error}")
        return 1

    if not blueprints_dir.is_dir():
        print(f"Blueprints directory not found at {blueprints_dir}")
        return 1

    json_files = sorted(blueprints_dir.glob("*.json"))
    if not json_files:
        print(f"No blueprint JSON files found in {blueprints_dir}")
        return 1

    ok_count = 0
    fail_count = 0

    for path in json_files:
        print(f"Validating {path.name}")
        try:
            raw_text = path.read_text(encoding="utf-8")
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            print(f"  Invalid JSON: {exc}")
            fail_count += 1
            continue

        try:
            # Prefer Pydantic v2 style if available.
            validator = getattr(SpeciesBlueprint, "model_validate", None)
            if callable(validator):
                validator(data)
            else:
                SpeciesBlueprint.parse_obj(data)
        except ValidationError as exc:
            print("  Blueprint is invalid.")
            print(f"  Details: {exc}")
            fail_count += 1
        else:
            print("  Blueprint is valid.")
            ok_count += 1

    print()
    print(f"Validation complete. OK: {ok_count}, Failed: {fail_count}")
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
