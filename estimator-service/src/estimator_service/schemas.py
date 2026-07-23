from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator

from estimator_service.constants import (
    ErrorCode,
    MAX_ESTIMATE_PROPERTIES,
    MAX_PAGE_LIMIT,
    MAX_SIGNED_INT64,
)
from estimator_service.models import (
    EstimatePage,
    EstimateRecord,
    PropertyFeatures,
    validate_year_built,
)


def _validate_signed_int64(value: int) -> int:
    if value > MAX_SIGNED_INT64:
        raise ValueError("value must fit in a signed 64-bit integer")
    return value


NonNegativeInt64Price = Annotated[
    int,
    Field(ge=0, json_schema_extra={"format": "int64"}),
    AfterValidator(_validate_signed_int64),
]


class PropertyInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    square_footage: float = Field(gt=0, allow_inf_nan=False, examples=[1850])
    bedrooms: int = Field(ge=0, allow_inf_nan=False, examples=[3])
    bathrooms: float = Field(ge=0, allow_inf_nan=False, examples=[2.5])
    year_built: int = Field(ge=1800, allow_inf_nan=False, examples=[1998])
    lot_size: float = Field(gt=0, allow_inf_nan=False, examples=[7500])
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

    def to_features(self) -> PropertyFeatures:
        return PropertyFeatures(**self.model_dump())


class EstimateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    properties: list[PropertyInput] = Field(
        min_length=1,
        max_length=MAX_ESTIMATE_PROPERTIES,
    )


class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    predictions: list[NonNegativeInt64Price]
    count: int = Field(ge=0)


class ResponseModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
        from_attributes=True,
    )


class PropertyResponse(ResponseModel):
    square_footage: float
    bedrooms: int
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float


class EstimateRecordResponse(ResponseModel):
    id: UUID
    property: PropertyResponse
    estimated_price: NonNegativeInt64Price
    created_at: datetime

    @classmethod
    def from_record(cls, record: EstimateRecord) -> EstimateRecordResponse:
        return cls.model_validate(record)


class EstimateBatchResponse(ResponseModel):
    estimates: list[EstimateRecordResponse]
    count: int = Field(ge=0)

    @classmethod
    def from_records(
        cls,
        records: tuple[EstimateRecord, ...],
    ) -> EstimateBatchResponse:
        return cls(
            estimates=[
                EstimateRecordResponse.from_record(record) for record in records
            ],
            count=len(records),
        )


class EstimatePageResponse(EstimateBatchResponse):
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=MAX_PAGE_LIMIT)
    offset: int = Field(ge=0)

    @classmethod
    def from_page(cls, page: EstimatePage) -> EstimatePageResponse:
        return cls(
            estimates=[
                EstimateRecordResponse.from_record(record)
                for record in page.estimates
            ],
            count=len(page.estimates),
            total=page.total,
            limit=page.limit,
            offset=page.offset,
        )


class HealthResponse(ResponseModel):
    status: Literal["ok"]


class ErrorResponse(ResponseModel):
    error_code: ErrorCode
    message: str
