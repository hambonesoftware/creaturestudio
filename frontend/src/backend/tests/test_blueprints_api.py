import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings


client = TestClient(app)


def test_list_blueprints_includes_elephant():
    response = client.get("/api/blueprints")
    assert response.status_code == 200
    data = response.json()
    names = [item["name"] for item in data]
    assert "Elephant" in names


def test_get_elephant_blueprint_round_trip():
    response = client.get("/api/blueprints/Elephant")
    assert response.status_code == 200
    data = response.json()
    assert data["meta"]["name"] == "Elephant"
    assert "skeleton" in data
    assert "bones" in data["skeleton"]
    assert len(data["skeleton"]["bones"]) > 0


def test_put_and_get_custom_blueprint(tmp_path):
    settings = get_settings()
    blueprints_dir = settings.blueprints_dir

    # Load the existing Elephant blueprint as a starting point.
    elephant_path = blueprints_dir / "ElephantBlueprint.json"
    assert elephant_path.is_file(), "ElephantBlueprint.json must exist for tests."

    elephant_data = json.loads(elephant_path.read_text(encoding="utf-8"))

    # Modify the meta to create a new animal.
    elephant_data["meta"]["name"] = "TestAnimal"
    elephant_data["meta"]["version"] = "0.0.1"
    elephant_data["meta"]["description"] = "Test animal created by unit test."

    # Create or update via the API.
    response_put = client.put("/api/blueprints/TestAnimal", json=elephant_data)
    assert response_put.status_code == 200
    body = response_put.json()
    assert body["meta"]["name"] == "TestAnimal"

    # Fetch again via GET.
    response_get = client.get("/api/blueprints/TestAnimal")
    assert response_get.status_code == 200
    data = response_get.json()
    assert data["meta"]["name"] == "TestAnimal"
    assert data["meta"]["version"] == "0.0.1"
