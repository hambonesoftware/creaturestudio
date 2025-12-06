from functools import lru_cache
from pathlib import Path

from pydantic import Field

try:
    # Pydantic v2 style (BaseSettings moved to pydantic_settings)
    from pydantic_settings import BaseSettings  # type: ignore
except Exception:  # pragma: no cover - fallback for Pydantic v1
    from pydantic import BaseSettings  # type: ignore


class Settings(BaseSettings):
    """Application settings for CreatureStudio.

    Values can be overridden via environment variables with the prefix
    ``CREATURESTUDIO_``. For example::

        CREATURESTUDIO_EXPORTS_DIR=/tmp/creature_exports
    """

    app_name: str = "CreatureStudio"

    # Root of the CreatureStudio project (the directory that contains
    # ``backend/``, ``frontend/``, ``shared/``, ``docs/``, and ``exports/``).
    base_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2]
    )

    backend_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "backend"
    )
    frontend_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "frontend"
    )
    shared_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "shared"
    )

    # Where template JSON blueprints (quadruped, biped, etc.) live.
    templates_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2]
        / "shared"
        / "templates"
    )

    # Where blueprint JSON / schemas will eventually live.
    blueprints_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2]
        / "shared"
        / "blueprints"
    )

    # Where export artifacts (saved animals, images, etc.) should be written.
    exports_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "exports"
    )

    # Where markdown documentation (including the animalrulebook) lives.
    docs_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "docs"
    )

    class Config:
        env_prefix = "CREATURESTUDIO_"
        arbitrary_types_allowed = True


@lru_cache(maxsize=1)
def get_settings() -> "Settings":
    """Return a cached Settings instance."""
    return Settings()
