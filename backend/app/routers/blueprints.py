"""FastAPI router providing CRUD operations for Species Blueprints."""

from __future__ import annotations

from typing import List
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, UploadFile, File, status

from app.models.blueprint import BlueprintMeta, SpeciesBlueprint
from app.services.blueprint_store import (
    BlueprintNotFoundError,
    BlueprintValidationError,
    ProtectedBlueprintError,
    list_blueprints,
    load_blueprint,
    save_blueprint,
    delete_blueprint,
    create_blueprint_from_template,
    import_blueprint_from_bytes,
)


router = APIRouter(prefix="/api/blueprints", tags=["blueprints"])

class NewBlueprintRequest(BaseModel):
    """Payload for creating a new species from a built-in template."""
    name: str
    templateType: str


@router.post("", response_model=SpeciesBlueprint)
def create_blueprint(request: NewBlueprintRequest) -> SpeciesBlueprint:
    """Create a new blueprint on disk from a template.

    This is the main entry point for the "New from Template" UI action.
    """
    try:
        blueprint = create_blueprint_from_template(
            name=request.name,
            template_type=request.templateType,
        )
        return blueprint
    except ProtectedBlueprintError as exc:
        # 409: conflict with a protected name (e.g., "Elephant").
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except BlueprintValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail="Failed to create blueprint from template") from exc


@router.post("/import", response_model=SpeciesBlueprint)
async def import_blueprint(file: UploadFile | None = File(None)) -> SpeciesBlueprint:
    """Import a blueprint JSON file and persist it on disk.

    The uploaded file should contain a SpeciesBlueprint JSON document. The
    server validates it and writes it into the configured blueprints_dir.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        content = await file.read()
        blueprint = import_blueprint_from_bytes(content)
        return blueprint
    except ProtectedBlueprintError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except BlueprintValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail="Failed to import blueprint") from exc



class BlueprintListItem(BlueprintMeta):
    """Response model for list endpoint including logical name.

    This inherits from :class:`BlueprintMeta` (which already includes
    a ``name`` field) but is kept as a distinct type in case we want
    to extend it with additional list-only fields in the future.
    """

    # No extra fields for now; `name`/`version`/etc. come from BlueprintMeta.
    pass


@router.get(
    "",
    response_model=List[BlueprintListItem],
    status_code=status.HTTP_200_OK,
    summary="List available species blueprints",
)
def get_blueprints() -> List[BlueprintListItem]:
    """Return metadata for all available blueprints."""
    metas = list_blueprints()
    # They are already BlueprintMeta instances; we can return them directly
    # thanks to BlueprintListItem inheriting from BlueprintMeta.
    return [BlueprintListItem(**m.dict()) for m in metas]


@router.get(
    "/{name}",
    response_model=SpeciesBlueprint,
    status_code=status.HTTP_200_OK,
    summary="Get a specific species blueprint",
)
def get_blueprint(name: str) -> SpeciesBlueprint:
    """Return the full :class:`SpeciesBlueprint` for *name*."""
    try:
        return load_blueprint(name)
    except BlueprintNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except BlueprintValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": str(exc), "details": exc.details},
        ) from exc


@router.put(
    "/{name}",
    response_model=SpeciesBlueprint,
    status_code=status.HTTP_200_OK,
    summary="Create or update a species blueprint",
)
def put_blueprint(name: str, blueprint: SpeciesBlueprint) -> SpeciesBlueprint:
    """Create or update a blueprint.

    The blueprint is validated as a :class:`SpeciesBlueprint`. If the
    path parameter *name* does not match ``blueprint.meta.name``, the
    latter is overwritten to keep things consistent on disk.
    """
    # Ensure the meta.name matches the requested logical name.
    if blueprint.meta.name != name:
        meta = blueprint.meta.copy(update={"name": name})
        blueprint = blueprint.copy(update={"meta": meta})

    try:
        save_blueprint(name, blueprint)
    except BlueprintValidationError as exc:
        # This is unlikely here because validation already occurred, but we keep
        # the error mapping explicit.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": str(exc), "details": exc.details},
        ) from exc

    # Re-load to ensure round-trip correctness.
    return load_blueprint(name)


@router.delete(
    "/{name}",
    status_code=status.HTTP_200_OK,
    summary="Delete a species blueprint",
)
def delete_blueprint_endpoint(name: str) -> dict:
    """Delete a blueprint unless it is protected.

    On success this returns HTTP 200 with a small JSON body.
    """
    try:
        delete_blueprint(name)
    except ProtectedBlueprintError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except BlueprintNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    return {"status": "deleted", "name": name}
