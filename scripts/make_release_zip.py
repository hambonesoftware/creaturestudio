"""Release packaging helper for CreatureStudio.

This script creates a versioned release zip of the CreatureStudio project.
It is primarily intended for local packaging and distribution – *not* for
uploading build artifacts into git.

Usage (from the project root):

    python scripts/make_release_zip.py --version 0.1.9

This will create:

    ../CreatureStudioV0.1.9.zip

The script is version-agnostic – you can use any semantic version string.
For example:

    python scripts/make_release_zip.py --version 0.1.0
    python scripts/make_release_zip.py --version 0.2.0-alpha1

The archive contains a single top-level `CreatureStudio/` directory with
all relevant source files, tests, docs, and shared assets.

Directories such as `.git`, `node_modules`, virtualenvs, `__pycache__`,
and `exports/` are intentionally excluded from the archive.
"""

from __future__ import annotations

import argparse
import os
import zipfile
from pathlib import Path
from typing import Iterable


EXCLUDE_DIRS = {
    ".git",
    ".idea",
    ".vscode",
    "node_modules",
    "env",
    "venv",
    ".venv",
    "__pycache__",
    "exports",
}

EXCLUDE_SUFFIXES = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".log",
}

EXCLUDE_NAMES = {
    ".DS_Store",
    "Thumbs.db",
}


def _should_skip(file_path: Path, rel_path: Path) -> bool:
    """Return True if *file_path* should be excluded from the release.

    The decision is based on `EXCLUDE_DIRS`, `EXCLUDE_SUFFIXES`,
    `EXCLUDE_NAMES`, and a simple "no nested zip files" rule.
    """
    # Skip anything under an excluded directory.
    for part in rel_path.parts:
        if part in EXCLUDE_DIRS:
            return True

    # Skip known uninteresting filenames.
    if rel_path.name in EXCLUDE_NAMES:
        return True

    # Skip known uninteresting suffixes.
    if file_path.suffix in EXCLUDE_SUFFIXES:
        return True

    # Never embed a zip file inside the release zip.
    if file_path.suffix == ".zip":
        return True

    return False


def _iter_project_files(project_root: Path) -> Iterable[tuple[Path, Path]]:
    """Yield `(file_path, rel_path)` pairs for all files to include.

    `rel_path` is always relative to `project_root`.
    """
    for root, dirs, files in os.walk(project_root):
        root_path = Path(root)
        rel_root = root_path.relative_to(project_root)

        # Prune excluded directories in-place so os.walk does not descend.
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for name in files:
            file_path = root_path / name
            rel_path = file_path.relative_to(project_root)

            if _should_skip(file_path, rel_path):
                continue

            yield file_path, rel_path


def make_release_zip(version: str) -> Path:
    """Create a release zip for the given *version*.

    The output archive is written one directory **above** the project root
    and is named:

        CreatureStudioV{version}.zip

    The archive contains a single top-level directory named `CreatureStudio/`.
    """
    project_root = Path(__file__).resolve().parents[1]
    parent = project_root.parent

    out_name = f"creatureStudioV{version}.zip"
    out_path = parent / out_name

    if out_path.exists():
        out_path.unlink()

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file_path, rel_path in _iter_project_files(project_root):
            arcname = Path("CreatureStudio") / rel_path
            zf.write(file_path, arcname=str(arcname))

    return out_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Create a versioned release zip of the CreatureStudio project."
    )
    parser.add_argument(
        "--version",
        default="0.1.0",
        help=(
            "Version string to embed in the archive filename "
            "(default: %(default)s, example: 0.1.9)."
        ),
    )

    args = parser.parse_args(argv)
    out_path = make_release_zip(args.version)

    print(f"Created release archive at: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
