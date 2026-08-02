from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from housing_common import property_metadata
from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from estimator_service import domain
from estimator_service.constants import (
    MAX_ESTIMATE_PROPERTIES,
    MAX_PAGE_LIMIT,
    MAX_SIGNED_INT64,
)
from estimator_service.errors import ErrorCode
from estimator_service.property_metadata import PROPERTY_METADATA


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


class PropertyFeaturesInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    square_footage: float = _feature_field(PROPERTY_METADATA.features.square_footage, 1850)
    bedrooms: int = _feature_field(PROPERTY_METADATA.features.bedrooms, 3)
    bathrooms: float = _feature_field(PROPERTY_METADATA.features.bathrooms, 2.5)
    year_built: int = _feature_field(PROPERTY_METADATA.features.year_built, 1998)
    lot_size: float = _feature_field(PROPERTY_METADATA.features.lot_size, 7500)
    distance_to_city_center: float = _feature_field(PROPERTY_METADATA.features.distance_to_city_center, 5.6)
    school_rating: float = _feature_field(PROPERTY_METADATA.features.school_rating, 8.2)

    def to_features(self) -> domain.PropertyFeatures:
        return domain.PropertyFeatures(**self.model_dump())


class EstimateBatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    properties: list[PropertyFeaturesInput] = Field(
        min_length=1,
        max_length=MAX_ESTIMATE_PROPERTIES,
    )


class ApiOutputModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
        from_attributes=True,
    )


class PropertyFeatures(ApiOutputModel):
    square_footage: float
    bedrooms: int
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float


class Estimate(ApiOutputModel):
    property_features: PropertyFeatures
    estimated_price: PositiveInt64Price
    created_at: datetime

    @classmethod
    def from_domain(cls, estimate: domain.Estimate) -> Estimate:
        return cls.model_validate(estimate)


class EstimateBatchResponse(ApiOutputModel):
    estimates: list[Estimate]

    @classmethod
    def from_estimates(
        cls,
        estimates: tuple[domain.Estimate, ...],
    ) -> EstimateBatchResponse:
        return cls(
            estimates=[Estimate.from_domain(estimate) for estimate in estimates],
        )


class EstimatePageResponse(EstimateBatchResponse):
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=MAX_PAGE_LIMIT)
    offset: int = Field(ge=0)

    @classmethod
    def from_page(cls, page: domain.EstimatePage) -> EstimatePageResponse:
        return cls(
            estimates=[Estimate.from_domain(estimate) for estimate in page.estimates],
            total=page.total,
            limit=page.limit,
            offset=page.offset,
        )


class HealthResponse(ApiOutputModel):
    status: Literal["ok"]


class FeatureMetadata(ApiOutputModel):
    min: int | float
    max: int | float
    unit: str | None

    @classmethod
    def from_metadata(cls, metadata: property_metadata.FeatureMetadata) -> FeatureMetadata:
        return cls(min=metadata.min, max=metadata.max, unit=metadata.unit)


class PropertyFeaturesMetadata(ApiOutputModel):
    square_footage: FeatureMetadata
    bedrooms: FeatureMetadata
    bathrooms: FeatureMetadata
    year_built: FeatureMetadata
    lot_size: FeatureMetadata
    distance_to_city_center: FeatureMetadata
    school_rating: FeatureMetadata

    @classmethod
    def from_metadata(
        cls,
        metadata: property_metadata.PropertyFeaturesMetadata,
    ) -> PropertyFeaturesMetadata:
        return cls(
            square_footage=FeatureMetadata.from_metadata(metadata.square_footage),
            bedrooms=FeatureMetadata.from_metadata(metadata.bedrooms),
            bathrooms=FeatureMetadata.from_metadata(metadata.bathrooms),
            year_built=FeatureMetadata.from_metadata(metadata.year_built),
            lot_size=FeatureMetadata.from_metadata(metadata.lot_size),
            distance_to_city_center=FeatureMetadata.from_metadata(metadata.distance_to_city_center),
            school_rating=FeatureMetadata.from_metadata(metadata.school_rating),
        )


class PropertyMetadataResponse(ApiOutputModel):
    features: PropertyFeaturesMetadata
    price_currency: str

    @classmethod
    def from_metadata(
        cls,
        metadata: property_metadata.PropertyMetadata,
    ) -> PropertyMetadataResponse:
        return cls(
            features=PropertyFeaturesMetadata.from_metadata(metadata.features),
            price_currency=metadata.price_currency,
        )


class ErrorResponse(ApiOutputModel):
    error_code: ErrorCode
    message: str
