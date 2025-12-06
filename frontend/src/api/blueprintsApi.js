// Simple fetch wrappers for the CreatureStudio blueprints backend.
//
// All functions here talk to the FastAPI service exposed by the backend.
// They assume the frontend is served from the same origin as the API
// (e.g. Vite dev server proxy or a combined deployment).
//
// Endpoints used:
// - GET    /api/blueprints
// - GET    /api/blueprints/{name}
// - PUT    /api/blueprints/{name}

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const API_BASE = "/creaturestudio/api";


async function handleResponse(response) {
  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = JSON.stringify(data, null, 2);
    } catch {
      detail = await response.text();
    }
    throw new Error(
      `[${response.status}] ${response.statusText || "Request failed"}\n${detail}`.trim()
    );
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    // Not JSON – just return raw text.
    return text;
  }
}

export async function listBlueprints() {
  const response = await fetch(`${API_BASE}/blueprints`, {
    method: "GET",
  });
  return handleResponse(response);
}

export async function getBlueprint(name) {
  if (!name) {
    throw new Error("getBlueprint requires a non-empty name");
  }
  const response = await fetch(`${API_BASE}/blueprints/${encodeURIComponent(name)}`, {
    method: "GET",
  });
  return handleResponse(response);
}

export async function putBlueprint(name, blueprint) {
  if (!name) {
    throw new Error("putBlueprint requires a non-empty name");
  }
  if (!blueprint) {
    throw new Error("putBlueprint requires a blueprint payload");
  }
  const response = await fetch(`${API_BASE}/blueprints/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(blueprint, null, 2),
  });
  return handleResponse(response);
}

export async function createBlueprintFromTemplate(name, templateType) {
  if (!name || !name.trim()) {
    throw new Error("Blueprint name must be a non-empty string.");
  }

  const payload = {
    name: name.trim(),
    templateType: (templateType || "").trim(),
  };

  const response = await fetch(`${API_BASE}/blueprints`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function importBlueprintFromFile(file) {
  if (!file) {
    throw new Error("importBlueprintFromFile requires a File object.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/blueprints/import`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}
