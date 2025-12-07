"""Upgrade the Elephant blueprint to schema version 4.1.0 with geometry options."""
import argparse
import json
from pathlib import Path

SCHEMA_VERSION = "4.1.0"


def build_elephant_options():
    torso_options = {
        "radii": [1.15, 1.35, 1.0],
        "sides": 28,
        "radiusProfile": "elephant_heavy",
        "rumpBulgeDepth": 0.4,
        "extendRumpToRearLegs": {
            "bones": [
                "back_left_foot",
                "back_right_foot",
                "back_left_lower",
                "back_right_lower",
                "back_left_upper",
                "back_right_upper",
            ],
            "extraMargin": 0.05,
            "boneRadii": {
                "back_left_upper": 0.5,
                "back_right_upper": 0.5,
                "back_left_lower": 0.42,
                "back_right_lower": 0.42,
                "back_left_foot": 0.44,
                "back_right_foot": 0.44,
            },
        },
        "lowPoly": False,
        "lowPolySegments": 9,
        "lowPolyWeldTolerance": 0.02,
    }

    neck_options = {
        "radii": [0.95, 0.38],
        "sides": 18,
        "capBase": True,
        "capEnd": True,
    }

    head_options = {
        "parentBone": "head",
        "radius": 0.95,
        "sides": 22,
        "elongation": 1.0,
    }

    trunk_options = {
        "baseRadius": 0.46,
        "midRadius": 0.07,
        "tipRadius": 0.26,
        "sides": 24,
        "lengthScale": 1.0,
        "rootBone": "trunk_anchor",
    }

    tusk_options = {
        "baseRadius": 0.12,
        "tipRadius": 0.02,
        "sides": 16,
        "lengthScale": 1.0,
    }

    ear_base = {
        "radii": [0.65, 0.35],
        "sides": 20,
        "flatten": 0.18,
    }

    return {
        "torso": {"generator": "torso", "options": torso_options},
        "neck": {"generator": "neck", "options": neck_options},
        "head": {"generator": "head", "options": head_options},
        "trunk": {"generator": "nose", "options": trunk_options},
        "tail": {
            "generator": "tail",
            "options": {"baseRadius": 0.15, "tipRadius": 0.05, "sides": 14},
        },
        "earLeft": {
            "generator": "ear",
            "options": {**ear_base, "tilt": 0.7853981633974483},
        },
        "earRight": {
            "generator": "ear",
            "options": {**ear_base, "tilt": -0.7853981633974483},
        },
        "frontLegL": {
            "generator": "limb",
            "options": {
                "radii": [0.5, 0.45, 0.4, 0.38, 0.43],
                "sides": 20,
            },
        },
        "frontLegR": {
            "generator": "limb",
            "options": {
                "radii": [0.5, 0.45, 0.4, 0.38, 0.43],
                "sides": 20,
            },
        },
        "backLegL": {
            "generator": "limb",
            "options": {
                "radii": [0.55, 0.5, 0.42, 0.38, 0.44],
                "sides": 20,
            },
        },
        "backLegR": {
            "generator": "limb",
            "options": {
                "radii": [0.55, 0.5, 0.42, 0.38, 0.44],
                "sides": 20,
            },
        },
        "tuskLeft": {"generator": "nose", "options": tusk_options},
        "tuskRight": {"generator": "nose", "options": tusk_options},
    }


def upgrade_blueprint(input_path: Path, output_path: Path) -> None:
    blueprint = json.loads(input_path.read_text())
    blueprint.setdefault("meta", {})["schemaVersion"] = SCHEMA_VERSION

    part_options = build_elephant_options()
    body_parts = blueprint.setdefault("bodyParts", {})

    for part_name, config in part_options.items():
        if part_name not in body_parts:
            body_parts[part_name] = {"chain": part_name, **config}
        else:
            body_parts[part_name]["generator"] = config["generator"]
            body_parts[part_name]["options"] = config["options"]

    output_path.write_text(json.dumps(blueprint, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("shared/blueprints/ElephantBlueprint.json"),
        help="Path to the existing Elephant blueprint JSON.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("shared/blueprints/ElephantBlueprint.4.1.0.json"),
        help="Path to write the upgraded blueprint.",
    )

    args = parser.parse_args()
    upgrade_blueprint(args.input, args.output)
    print(f"Upgraded blueprint written to {args.output} (schema {SCHEMA_VERSION})")


if __name__ == "__main__":
    main()
