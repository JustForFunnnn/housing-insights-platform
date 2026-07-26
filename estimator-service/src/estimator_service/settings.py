from __future__ import annotations

from pathlib import Path

from pydantic import AnyHttpUrl, Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings

DEFAULT_PROPERTY_METADATA_PATH = Path("../contracts/property-metadata.json")


class Settings(BaseSettings):
    property_metadata_path: Path = Field(
        default=DEFAULT_PROPERTY_METADATA_PATH,
        validation_alias="PROPERTY_METADATA_PATH",
    )
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
    estimator_database_url: PostgresDsn = Field(
        default=PostgresDsn(
            "postgresql+asyncpg://estimator:estimator@localhost:15432/estimator"
        ),
        validation_alias="ESTIMATOR_DATABASE_URL",
    )

    @field_validator("estimator_database_url")
    @classmethod
    def require_asyncpg(cls, value: PostgresDsn) -> PostgresDsn:
        if value.scheme != "postgresql+asyncpg":
            raise ValueError(
                "ESTIMATOR_DATABASE_URL must use postgresql+asyncpg"
            )
        return value
