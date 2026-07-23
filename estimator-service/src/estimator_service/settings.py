from __future__ import annotations

from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    prediction_service_url: AnyHttpUrl = Field(
        default=AnyHttpUrl("http://localhost:9000"),
        validation_alias="PREDICTION_SERVICE_URL",
    )
    prediction_service_timeout_seconds: float = Field(
        default=5,
        gt=0,
        allow_inf_nan=False,
        validation_alias="PREDICTION_SERVICE_TIMEOUT_SECONDS",
    )
    estimator_database_path: Path = Field(
        default=Path("data/estimator.db"),
        validation_alias="ESTIMATOR_DATABASE_PATH",
    )
