"""
Small validation utility for CreatureStudio V2 blueprints.

This script loads a selection of SpeciesBlueprint JSON files and
performs sanity checks on their V2 anatomy fields (`chainsV2` and
`bodyPartsV2`). It ensures that:

1. `chainsV2` is a list of objects each with a `name` (string) and
   a non-empty `bones` list.
2. `bodyPartsV2` is a list of objects each with a `name`, `chain`, and
   `generator` referencing a defined chain and a known generator name.
3. There are no duplicate chain names or body part names.

The script prints validation results for each blueprint.  If any
violations are found, an AssertionError is raised.

Usage:

    python scripts/test_v2_blueprints.py

Note: This test does not require Three.js or Node modules and can
run directly in the Python environment.  It complements the Node
smoke tests by verifying the integrity of the blueprint data.
"""

import json
import sys
import os
from pathlib import Path


KNOWN_GENERATORS = {
    "torsoGenerator",
    "limbGenerator",
    "wingGenerator",
    "tailGenerator",
    "headGenerator",
    "noseGenerator",
    "earGenerator",
}


def validate_blueprint(path: Path):
    data = json.loads(path.read_text())
    name = data.get("meta", {}).get("name", path.stem)
    chains = data.get("chainsV2", [])
    body_parts = data.get("bodyPartsV2", [])
    # Ensure list types
    assert isinstance(chains, list), f"{name}: chainsV2 should be a list"
    assert isinstance(body_parts, list), f"{name}: bodyPartsV2 should be a list"
    chain_names = set()
    for chain in chains:
        assert isinstance(chain.get("name"), str) and chain["name"], f"{name}: chain missing or invalid name"
        assert isinstance(chain.get("bones"), list) and chain["bones"], f"{name}: chain {chain['name']} must define bones"
        assert chain["name"] not in chain_names, f"{name}: duplicate chain name {chain['name']}"
        chain_names.add(chain["name"])
    part_names = set()
    for part in body_parts:
        assert isinstance(part.get("name"), str) and part["name"], f"{name}: body part missing or invalid name"
        assert isinstance(part.get("chain"), str) and part["chain"], f"{name}: body part {part['name']} must reference a chain"
        assert isinstance(part.get("generator"), str) and part["generator"], f"{name}: body part {part['name']} must specify a generator"
        assert part["chain"] in chain_names, f"{name}: body part {part['name']} references unknown chain {part['chain']}"
        assert part["generator"] in KNOWN_GENERATORS, f"{name}: body part {part['name']} uses unknown generator {part['generator']}"
        assert part["name"] not in part_names, f"{name}: duplicate body part name {part['name']}"
        part_names.add(part["name"])
    print(f"{name}: {len(chains)} chains, {len(body_parts)} body parts validated successfully")


def main():
    # Discover blueprint files in shared/blueprints and frontend/src/blueprints
    root = Path(__file__).resolve().parents[1]
    blueprint_dirs = [
        root / "shared" / "blueprints",
        root / "frontend" / "src" / "blueprints",
    ]
    ok = True
    for bp_dir in blueprint_dirs:
        for path in bp_dir.glob("*.json"):
            try:
                data = json.loads(path.read_text())
            except Exception:
                continue
            # Only validate if schemaVersion >= 4.2.0 and defines V2 fields
            meta = data.get("meta", {})
            version = meta.get("schemaVersion", "0.0.0")
            if not version or version < "4.2.0":
                continue
            try:
                validate_blueprint(path)
            except AssertionError as e:
                print(f"Validation failed for {path.name}: {e}")
                ok = False
    if not ok:
        raise SystemExit(1)
    print("All V2 blueprints passed sanity checks.")


if __name__ == "__main__":
    main()