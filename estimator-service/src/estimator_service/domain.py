from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class PropertyFeatures:
    square_footage: float
    bedrooms: int
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float

    def as_dict(self) -> dict[str, float | int]:
        return {
            "square_footage": self.square_footage,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "year_built": self.year_built,
            "lot_size": self.lot_size,
            "distance_to_city_center": self.distance_to_city_center,
            "school_rating": self.school_rating,
        }


@dataclass(frozen=True, slots=True)
class Estimate:
    property_features: PropertyFeatures
    estimated_price: int
    created_at: datetime


@dataclass(frozen=True, slots=True)
class EstimatePage:
    estimates: tuple[Estimate, ...]
    total: int
    limit: int
    offset: int
