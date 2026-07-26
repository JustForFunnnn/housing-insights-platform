from __future__ import annotations

from typing import Annotated, Literal

from housing_common.property_metadata import PropertyFeatureMetadata
from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from prediction_service.constants import MAX_PREDICTION_INSTANCES, MAX_SIGNED_INT64
from prediction_service.errors import ErrorCode
from prediction_service.models import HousingFeatures
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
    metadata: PropertyFeatureMetadata,
    example: int | float,
):
    return Field(
        ge=metadata.min,
        le=metadata.max,
        allow_inf_nan=False,
        examples=[example],
    )


class HousingFields(BaseModel):
    """Shared feature shape; concrete input models choose their own parsing policy."""

    square_footage: float = _feature_field(
        PROPERTY_METADATA.features.square_footage, 1850
    )
    bedrooms: int = _feature_field(PROPERTY_METADATA.features.bedrooms, 3)
    bathrooms: float = _feature_field(
        PROPERTY_METADATA.features.bathrooms, 2.5
    )
    year_built: int = _feature_field(
        PROPERTY_METADATA.features.year_built, 1998
    )
    lot_size: float = _feature_field(
        PROPERTY_METADATA.features.lot_size, 7500
    )
    distance_to_city_center: float = _feature_field(
        PROPERTY_METADATA.features.distance_to_city_center, 5.6
    )
    school_rating: float = _feature_field(
        PROPERTY_METADATA.features.school_rating, 8.2
    )

    def to_features(self) -> HousingFeatures:
        return HousingFeatures(**self.model_dump())


class PredictionInstance(HousingFields):
    model_config = ConfigDict(extra="forbid", strict=True)


class TrainingRow(HousingFields):
    model_config = ConfigDict(extra="ignore")

    price: PositiveInt64Price

    def to_features(self) -> HousingFeatures:
        values = self.model_dump(exclude={"price"})
        return HousingFeatures(**values)


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    instances: list[PredictionInstance] = Field(
        min_length=1,
        max_length=MAX_PREDICTION_INSTANCES,
    )


class ResponseModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
        from_attributes=True,
    )


class PredictionResponse(ResponseModel):
    predictions: list[PositiveInt64Price]


class ErrorResponse(ResponseModel):
    error_code: ErrorCode
    message: str


class MetricSummaryResponse(ResponseModel):
    mean: float
    std: float = Field(ge=0)


class ErrorMetricSummaryResponse(MetricSummaryResponse):
    mean: float = Field(ge=0)


class RegressionMetricsResponse(ResponseModel):
    r2: MetricSummaryResponse
    rmse: ErrorMetricSummaryResponse
    mae: ErrorMetricSummaryResponse


class CrossValidationResponse(ResponseModel):
    folds: int = Field(ge=2)
    shuffle: bool
    random_state: int
    metrics: RegressionMetricsResponse


class ModelInfoResponse(ResponseModel):
    training_timestamp: str
    algorithm: str
    target_transform: Literal["log"] = Field(
        description=(
            "The target is natural-log price; the intercept and coefficients "
            "operate in that space."
        )
    )
    features: list[str]
    intercept: float
    coefficients: dict[str, float]
    cross_validation: CrossValidationResponse


class HealthResponse(ResponseModel):
    status: Literal["ok"]
