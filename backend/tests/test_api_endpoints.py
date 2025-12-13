"""API-level tests covering root, health, export, and delete endpoints."""

import json
import shutil
import zipfile
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app


client = TestClient(app)


def _settings():
    return get_settings()


def _elephant_data() -> dict:
    settings = _settings()
    elephant_path = settings.blueprints_dir / "ElephantBlueprint.json"
    assert elephant_path.is_file(), "ElephantBlueprint.json must exist for tests."
    return json.loads(elephant_path.read_text(encoding="utf-8"))


def _cleanup(paths: list[Path]) -> None:
    for path in paths:
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        else:
            try:
                path.unlink()
            except FileNotFoundError:
                pass


def test_root_endpoint_returns_app_metadata():
    settings = _settings()
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["app"] == settings.app_name
    assert body["blueprints_dir"] == str(settings.blueprints_dir)
    assert body["exports_dir"] == str(settings.exports_dir)
    assert body["docs_dir"] == str(settings.docs_dir)


def test_health_endpoint_reports_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_delete_blueprint_endpoint_removes_file():
    settings = _settings()
    name = "UnitTest_DeleteSpecies"
    target_path = settings.blueprints_dir / f"{name}Blueprint.json"

    payload = _elephant_data()
    payload["meta"]["name"] = name

    _cleanup([target_path])

    try:
        put_response = client.put(f"/api/blueprints/{name}", json=payload)
        assert put_response.status_code == 200
        assert target_path.is_file()

        delete_response = client.delete(f"/api/blueprints/{name}")
        assert delete_response.status_code == 200
        assert delete_response.json() == {"status": "deleted", "name": name}
        assert not target_path.exists()
    finally:
        _cleanup([target_path])


def test_delete_protected_blueprint_returns_400():
    response = client.delete("/api/blueprints/Elephant")
    assert response.status_code == 400
    detail = response.json().get("detail", "")
    assert "protected" in detail.lower()


def test_export_endpoint_and_download_flow(tmp_path):
    settings = _settings()
    version = "4.2.0"

    response = client.post(f"/api/export/Elephant", json={"version": version})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["name"] == "Elephant"
    assert body["version"] == version
    assert body["zipPath"].startswith("/api/export/download/")

    filename = Path(body["zipPath"]).name
    zip_path = settings.exports_dir / filename
    staging_dir = settings.exports_dir / f"ElephantV{version}" / "Elephant"

    try:
        assert zip_path.is_file(), f"Expected export zip missing: {zip_path}"

        download = client.get(body["zipPath"])
        assert download.status_code == 200
        assert download.headers.get("content-type") == "application/zip"

        with zipfile.ZipFile(BytesIO(download.content), "r") as zf:
            names = zf.namelist()
            assert any(name.endswith("ElephantDefinition.js") for name in names)
    finally:
        _cleanup([zip_path])
        if staging_dir.parent.exists():
            _cleanup([staging_dir.parent])
