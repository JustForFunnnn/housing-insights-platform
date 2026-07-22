from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from prediction_service.models import HousingFeatures, validate_year_built

Int64Price = Annotated[int, Field(json_schema_extra={"format": "int64"})]
NonNegativeInt64Price = Annotated[
    int,
    Field(ge=0, json_schema_extra={"format": "int64"}),
]


class HousingFields(BaseModel):
    """Shared feature shape; concrete input models choose their own parsing policy."""

    square_footage: float = Field(gt=0, allow_inf_nan=False, examples=[1850])
    bedrooms: int = Field(ge=0, examples=[3])
    bathrooms: float = Field(ge=0, allow_inf_nan=False, examples=[2])
    year_built: int = Field(ge=1800, examples=[1998])
    lot_size: float = Field(ge=0, allow_inf_nan=False, examples=[7500])
    distance_to_city_center: float = Field(
        ge=0,
        allow_inf_nan=False,
        examples=[5.6],
    )
    school_rating: float = Field(
        ge=0,
        le=10,
        allow_inf_nan=False,
        examples=[8.2],
    )

    _year_is_not_in_future = field_validator("year_built")(validate_year_built)

    def to_domain(self) -> HousingFeatures:
        return HousingFeatures(**self.model_dump())


class PredictionInstance(HousingFields):
    model_config = ConfigDict(extra="ignore", strict=True)


class TrainingRow(HousingFields):
    model_config = ConfigDict(extra="ignore")

    price: NonNegativeInt64Price

    def to_domain(self) -> HousingFeatures:
        values = self.model_dump(exclude={"price"})
        return HousingFeatures(**values)


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    instances: list[PredictionInstance] = Field(min_length=1, max_length=100)


class ResponseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class PredictionResponse(ResponseModel):
    predictions: list[Int64Price]
    count: int = Field(ge=0)


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
