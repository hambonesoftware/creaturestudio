import json
import zipfile
from pathlib import Path

from app.config import get_settings
from app.models.blueprint import SpeciesBlueprint
from app.services.export_service import export_animal


def test_export_elephant_creates_zip_with_expected_files(tmp_path):
    settings = get_settings()
    blueprints_dir = settings.blueprints_dir

    elephant_path = blueprints_dir / "ElephantBlueprint.json"
    assert elephant_path.is_file(), "ElephantBlueprint.json must exist for tests."

    elephant_data = json.loads(elephant_path.read_text(encoding="utf-8"))
    elephant_blueprint = SpeciesBlueprint.parse_obj(elephant_data)

    version = "4.1.0"
    zip_path = export_animal(elephant_blueprint, version, config=settings)
    assert zip_path.is_file()

    with zipfile.ZipFile(zip_path, "r") as zf:
        names = zf.namelist()

    # Expect at least the JS files and blueprint JSON somewhere in the archive.
    assert any(name.endswith("ElephantDefinition.js") for name in names)
    assert any(name.endswith("ElephantGenerator.js") for name in names)
    assert any(name.endswith("ElephantCreature.js") for name in names)
    assert any(name.endswith("ElephantBehavior.js") for name in names)
    assert any(name.endswith("ElephantPen.js") for name in names)
    assert any(name.endswith("ElephantBlueprint.json") for name in names)
