from __future__ import annotations

import csv
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path

import pytest
from sklearn.linear_model import LinearRegression

from prediction_service.artifact import ModelArtifact
from prediction_service.constants import FEATURE_NAMES

DEFAULT_COLUMNS = ["id", *FEATURE_NAMES, "price"]


@pytest.fixture
def valid_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for index in range(15):
        square_footage = 900 + index * 85
        bedrooms = 2 + index % 4
        bathrooms = 1 + (index % 5) * 0.5
        year_built = 1980 + index
        lot_size = 4000 + index * 275
        distance = 1.0 + index * 0.4
        school_rating = 6.0 + (index % 5) * 0.6
        price = (
            40_000
            + square_footage * 120
            + bedrooms * 15_000
            + bathrooms * 9_000
            + lot_size * 2
            - distance * 1_500
            + school_rating * 4_000
        )
        rows.append(
            {
                "id": index + 1,
                "square_footage": square_footage,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "year_built": year_built,
                "lot_size": lot_size,
                "distance_to_city_center": distance,
                "school_rating": school_rating,
                "price": price,
            }
        )
    return rows


@pytest.fixture
def write_dataset(
    tmp_path: Path,
    valid_rows: list[dict[str, object]],
) -> Callable[..., Path]:
    def write(
        rows: list[dict[str, object]] | None = None,
        fieldnames: list[str] | None = None,
    ) -> Path:
        path = tmp_path / "training.csv"
        with path.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.DictWriter(
                stream,
                fieldnames=fieldnames or DEFAULT_COLUMNS,
                extrasaction="ignore",
            )
            writer.writeheader()
            writer.writerows(valid_rows if rows is None else rows)
        return path

    return write


@pytest.fixture
def artifact_factory(
    valid_rows: list[dict[str, object]],
) -> Callable[[], ModelArtifact]:
    def build() -> ModelArtifact:
        features = [[float(row[name]) for name in FEATURE_NAMES] for row in valid_rows]
        prices = [float(row["price"]) for row in valid_rows]
        return {
            "model": LinearRegression().fit(features, prices),
            "trained_at": datetime.now(UTC).isoformat(),
            "algorithm": "LinearRegression",
            "features": list(FEATURE_NAMES),
            "cross_validation": {
                "folds": 5,
                "shuffle": True,
                "random_state": 42,
                "metrics": {
                    "r2": {"mean": 0.95, "std": 0.02},
                    "rmse": {"mean": 12_000.0, "std": 1_000.0},
                    "mae": {"mean": 9_000.0, "std": 750.0},
                },
            },
        }

    return build
