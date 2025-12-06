from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers.blueprints import router as blueprints_router
from .routers.export import router as export_router


settings = get_settings()

app = FastAPI(
    title="CreatureStudio API",
    version="0.1.0",
    description="Backend API for CreatureStudio foundation (Phase 0-3).",
)

# Allow the Vite dev server by default.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers.
app.include_router(blueprints_router)
app.include_router(export_router)


@app.get("/")
async def root() -> dict:
    """Root endpoint providing basic app info and important paths."""
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "blueprints_dir": str(settings.blueprints_dir),
        "exports_dir": str(settings.exports_dir),
        "docs_dir": str(settings.docs_dir),
    }


@app.get("/health")
async def health() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok"}
