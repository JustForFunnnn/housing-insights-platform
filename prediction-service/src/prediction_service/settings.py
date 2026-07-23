from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="forbid",
    )

    model_artifact_path: Path = Field(
        default=Path("artifacts/model_pipeline.joblib"),
        validation_alias="MODEL_ARTIFACT_PATH",
    )
