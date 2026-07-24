from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


def validate_year_built(value: int) -> int:
    current_year = datetime.now().year
    if value > current_year:
        raise ValueError(f"year_built must be no later than {current_year}")
    return value


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
class EstimateRecord:
    property: PropertyFeatures
    estimated_price: int
    created_at: datetime


@dataclass(frozen=True, slots=True)
class EstimatePage:
    estimates: tuple[EstimateRecord, ...]
    total: int
    limit: int
    offset: int
