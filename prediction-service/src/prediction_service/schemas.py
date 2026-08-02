from __future__ import annotations

from typing import Annotated, Literal

from housing_common import property_metadata
from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from prediction_service import domain
from prediction_service.constants import MAX_PREDICTION_PROPERTIES, MAX_SIGNED_INT64
from prediction_service.errors import ErrorCode
from prediction_service.property_metadata import PROPERTY_METADATA


def _validate_signed_int64(value: int) -> int:
    if value > MAX_SIGNED_INT64:
        raise ValueError("value must fit in a signed 64-bit integer")
    return value


PositiveInt64Price = Annotated[
    int,
    Field(gt=0, json_schema_extra={"format": "int64"}),
    AfterValidator(_validate_signed_int64),
]


def _feature_field(
    metadata: property_metadata.FeatureMetadata,
    example: int | float,
):
    return Field(
        ge=metadata.min,
        le=metadata.max,
        allow_inf_nan=False,
        examples=[example],
    )


class PropertyFeatureFields(BaseModel):
    """Shared feature shape; concrete input models choose their own parsing policy."""

    square_footage: float = _feature_field(PROPERTY_METADATA.features.square_footage, 1850)
    bedrooms: int = _feature_field(PROPERTY_METADATA.features.bedrooms, 3)
    bathrooms: float = _feature_field(PROPERTY_METADATA.features.bathrooms, 2.5)
    year_built: int = _feature_field(PROPERTY_METADATA.features.year_built, 1998)
    lot_size: float = _feature_field(PROPERTY_METADATA.features.lot_size, 7500)
    distance_to_city_center: float = _feature_field(PROPERTY_METADATA.features.distance_to_city_center, 5.6)
    school_rating: float = _feature_field(PROPERTY_METADATA.features.school_rating, 8.2)

    def to_features(self) -> domain.PropertyFeatures:
        return domain.PropertyFeatures(**self.model_dump())


class PropertyFeaturesInput(PropertyFeatureFields):
    model_config = ConfigDict(extra="forbid", strict=True)


class TrainingRow(PropertyFeatureFields):
    model_config = ConfigDict(extra="ignore")

    price: PositiveInt64Price

    def to_features(self) -> domain.PropertyFeatures:
        values = self.model_dump(exclude={"price"})
        return domain.PropertyFeatures(**values)


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    properties: list[PropertyFeaturesInput] = Field(
        min_length=1,
        max_length=MAX_PREDICTION_PROPERTIES,
    )


class ApiOutputModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
        from_attributes=True,
    )


class PredictionResponse(ApiOutputModel):
    predictions: list[PositiveInt64Price]


class ErrorResponse(ApiOutputModel):
    error_code: ErrorCode
    message: str


class MetricSummary(ApiOutputModel):
    mean: float
    std: float = Field(ge=0)


class RegressionMetrics(ApiOutputModel):
    r2: MetricSummary
    rmse: MetricSummary
    mae: MetricSummary

    @model_validator(mode="after")
    def validate_error_metric_means(self) -> RegressionMetrics:
        if self.rmse.mean < 0 or self.mae.mean < 0:
            raise ValueError("error metric means must be non-negative")
        return self


class CrossValidationResult(ApiOutputModel):
    folds: int = Field(ge=2)
    shuffle: bool
    random_state: int
    metrics: RegressionMetrics


class ModelInfoResponse(ApiOutputModel):
    trained_at: str
    algorithm: str
    target_transform: Literal["log"] = Field(
        description=("The target is natural-log price; the intercept and coefficients operate in that space.")
    )
    features: list[str]
    intercept: float
    coefficients: dict[str, float]
    cross_validation: CrossValidationResult


class HealthResponse(ApiOutputModel):
    status: Literal["ok"]
