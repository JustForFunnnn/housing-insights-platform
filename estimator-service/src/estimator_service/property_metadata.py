from __future__ import annotations

import math
from pathlib import Path

from pydantic import (
    BaseModel,
    ConfigDict,
    StrictFloat,
    StrictInt,
    ValidationError,
    model_validator,
)

from estimator_service.errors import PropertyMetadataError
from estimator_service.settings import Settings

MetadataNumber = StrictInt | StrictFloat


class PropertyFeatureMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True, strict=True)

    min: MetadataNumber
    max: MetadataNumber
    unit: str | None

    @model_validator(mode="after")
    def validate_values(self) -> PropertyFeatureMetadata:
        values = (self.min, self.max)
        if not all(
            isinstance(value, int) or math.isfinite(value)
            for value in values
        ):
            raise ValueError("min and max must be finite")
        if self.min > self.max:
            raise ValueError("min must not exceed max")
        return self


class PropertyMetadataFeatures(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True, strict=True)

    square_footage: PropertyFeatureMetadata
    bedrooms: PropertyFeatureMetadata
    bathrooms: PropertyFeatureMetadata
    year_built: PropertyFeatureMetadata
    lot_size: PropertyFeatureMetadata
    distance_to_city_center: PropertyFeatureMetadata
    school_rating: PropertyFeatureMetadata


class PropertyMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True, strict=True)

    features: PropertyMetadataFeatures
    price_currency: str

    @classmethod
    def load(cls, path: Path) -> PropertyMetadata:
        try:
            return cls.model_validate_json(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValidationError) as exc:
            raise PropertyMetadataError(
                f"could not load valid property metadata: {path}"
            ) from exc


PROPERTY_METADATA = PropertyMetadata.load(Settings().property_metadata_path)
