from __future__ import annotations

from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator

from prediction_service.constants import (
    ErrorCode,
    MAX_BATHROOMS,
    MAX_BEDROOMS,
    MAX_DISTANCE_TO_CITY_CENTER,
    MAX_LOT_SIZE,
    MAX_PREDICTION_INSTANCES,
    MAX_SCHOOL_RATING,
    MAX_SIGNED_INT64,
    MAX_SQUARE_FOOTAGE,
)
from prediction_service.models import HousingFeatures, validate_year_built


def _validate_signed_int64(value: int) -> int:
    if value > MAX_SIGNED_INT64:
        raise ValueError("value must fit in a signed 64-bit integer")
    return value


NonNegativeInt64Price = Annotated[
    int,
    Field(ge=0, json_schema_extra={"format": "int64"}),
    AfterValidator(_validate_signed_int64),
]

PositiveInt64Price = Annotated[
    int,
    Field(gt=0, json_schema_extra={"format": "int64"}),
    AfterValidator(_validate_signed_int64),
]


class HousingFields(BaseModel):
    """Shared feature shape; concrete input models choose their own parsing policy."""

    square_footage: float = Field(
        gt=0,
        le=MAX_SQUARE_FOOTAGE,
        allow_inf_nan=False,
        examples=[1850],
    )
    bedrooms: int = Field(
        ge=0,
        le=MAX_BEDROOMS,
        allow_inf_nan=False,
        examples=[3],
    )
    bathrooms: float = Field(
        ge=0,
        le=MAX_BATHROOMS,
        allow_inf_nan=False,
        examples=[2.5],
    )
    year_built: int = Field(ge=1800, allow_inf_nan=False, examples=[1998])
    lot_size: float = Field(
        gt=0,
        le=MAX_LOT_SIZE,
        allow_inf_nan=False,
        examples=[7500],
    )
    distance_to_city_center: float = Field(
        ge=0,
        le=MAX_DISTANCE_TO_CITY_CENTER,
        allow_inf_nan=False,
        examples=[5.6],
    )
    school_rating: float = Field(
        ge=0,
        le=MAX_SCHOOL_RATING,
        allow_inf_nan=False,
        examples=[8.2],
    )

    _year_is_not_in_future = field_validator("year_built")(validate_year_built)

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
    predictions: list[NonNegativeInt64Price]
    count: int = Field(ge=0)


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
    features: list[str]
    intercept: float
    coefficients: dict[str, float]
    cross_validation: CrossValidationResponse


class HealthResponse(ResponseModel):
    status: Literal["ok"]
