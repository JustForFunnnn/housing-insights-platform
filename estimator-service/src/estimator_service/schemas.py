from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from estimator_service.constants import (
    MAX_ESTIMATE_PROPERTIES,
    MAX_PAGE_LIMIT,
    MAX_SIGNED_INT64,
)
from estimator_service.errors import ErrorCode
from estimator_service.models import (
    EstimatePage,
    EstimateRecord,
    PropertyFeatures,
)
from estimator_service.property_metadata import (
    PROPERTY_METADATA,
    PropertyFeatureMetadata,
    PropertyMetadata,
)


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


class PropertyInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

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

    predictions: list[PositiveInt64Price]


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
    property: PropertyResponse
    estimated_price: PositiveInt64Price
    created_at: datetime

    @classmethod
    def from_record(cls, record: EstimateRecord) -> EstimateRecordResponse:
        return cls.model_validate(record)


class EstimateBatchResponse(ResponseModel):
    estimates: list[EstimateRecordResponse]

    @classmethod
    def from_records(
        cls,
        records: tuple[EstimateRecord, ...],
    ) -> EstimateBatchResponse:
        return cls(
            estimates=[
                EstimateRecordResponse.from_record(record) for record in records
            ],
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
            total=page.total,
            limit=page.limit,
            offset=page.offset,
        )


class HealthResponse(ResponseModel):
    status: Literal["ok"]


class PropertyFeatureMetadataResponse(ResponseModel):
    min: int | float
    max: int | float
    unit: str | None


class PropertyMetadataFeaturesResponse(ResponseModel):
    square_footage: PropertyFeatureMetadataResponse
    bedrooms: PropertyFeatureMetadataResponse
    bathrooms: PropertyFeatureMetadataResponse
    year_built: PropertyFeatureMetadataResponse
    lot_size: PropertyFeatureMetadataResponse
    distance_to_city_center: PropertyFeatureMetadataResponse
    school_rating: PropertyFeatureMetadataResponse


class PropertyMetadataResponse(ResponseModel):
    features: PropertyMetadataFeaturesResponse
    price_currency: str

    @classmethod
    def from_metadata(
        cls,
        metadata: PropertyMetadata,
    ) -> PropertyMetadataResponse:
        return cls(
            features=PropertyMetadataFeaturesResponse.model_validate(
                metadata.features
            ),
            price_currency=metadata.price_currency,
        )


class ErrorResponse(ResponseModel):
    error_code: ErrorCode
    message: str
