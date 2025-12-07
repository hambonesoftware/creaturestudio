"""FastAPI router for exporting species blueprints as Zoo-style bundles."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import get_settings
from app.services.blueprint_store import (
    BlueprintNotFoundError,
    BlueprintValidationError,
    load_blueprint,
)
from app.services.export_service import export_animal


router = APIRouter(prefix="/api/export", tags=["export"])


class ExportRequest(BaseModel):
    """Request body model for the export endpoint."""

    version: str


@router.post(
    "/{name}",
    status_code=status.HTTP_200_OK,
    summary="Export a blueprint as a Zoo-style animal zip",
)
async def export_blueprint(name: str, body: ExportRequest) -> Dict[str, Any]:
    """Export the blueprint identified by *name*.

    The request body must contain a ``version`` field, for example::

        { "version": "4.1.0" }
    """
    version = body.version.strip()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing or invalid 'version' in request body.",
        )

    try:
        blueprint = load_blueprint(name)
    except BlueprintNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except BlueprintValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": str(exc), "details": exc.details},
        ) from exc

    zip_path = export_animal(blueprint, version)

    filename = zip_path.name
    download_path = f"/api/export/download/{filename}"

    return {
        "name": blueprint.meta.name,
        "version": version,
        "zipPath": download_path,
    }


@router.get(
    "/download/{filename}",
    summary="Download an exported animal zip",
)
async def download_export(filename: str) -> FileResponse:
    """Stream an exported zip file to the client."""
    settings = get_settings()
    exports_root = settings.exports_dir

    file_path = (exports_root / filename).resolve()
    exports_root_resolved = exports_root.resolve()

    try:
        # Ensure the requested file is inside the exports directory.
        file_path.relative_to(exports_root_resolved)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename.",
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not found.",
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/zip",
        filename=file_path.name,
    )
