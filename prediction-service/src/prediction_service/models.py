from __future__ import annotations

import math
from dataclasses import dataclass

from prediction_service.constants import FEATURE_NAMES


@dataclass(frozen=True, slots=True)
class HousingFeatures:
    square_footage: float
    bedrooms: int
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float

    def as_row(self) -> list[float]:
        return [float(getattr(self, name)) for name in FEATURE_NAMES]


@dataclass(frozen=True, slots=True)
class MetricSummary:
    mean: float
    std: float

    def __post_init__(self) -> None:
        if not math.isfinite(self.mean) or not math.isfinite(self.std):
            raise ValueError("metric values must be finite")
        if self.std < 0:
            raise ValueError("metric standard deviation must be non-negative")


@dataclass(frozen=True, slots=True)
class RegressionMetrics:
    r2: MetricSummary
    rmse: MetricSummary
    mae: MetricSummary

    def __post_init__(self) -> None:
        if self.rmse.mean < 0 or self.mae.mean < 0:
            raise ValueError("error metric means must be non-negative")


@dataclass(frozen=True, slots=True)
class CrossValidationInfo:
    folds: int
    shuffle: bool
    random_state: int
    metrics: RegressionMetrics


@dataclass(frozen=True, slots=True)
class ModelInfo:
    training_timestamp: str
    algorithm: str
    features: tuple[str, ...]
    intercept: float
    coefficients: dict[str, float]
    cross_validation: CrossValidationInfo
