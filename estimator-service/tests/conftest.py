from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

import pytest

from estimator_service.app import create_app
from estimator_service.data_access import SQLiteEstimateStore
from estimator_service.models import PropertyFeatures

VALID_PROPERTY = {
    "square_footage": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1998,
    "lot_size": 7500,
    "distance_to_city_center": 5.6,
    "school_rating": 8.2,
}


class StubPredictionClient:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.calls: list[tuple[list[PropertyFeatures], str]] = []

    async def predict(
        self,
        properties: Sequence[PropertyFeatures],
        request_id: str,
    ) -> list[int]:
        captured = list(properties)
        self.calls.append((captured, request_id))
        if self.error is not None:
            raise self.error
        return [round(item.square_footage * 100) for item in captured]


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def app_factory(tmp_path: Path):
    def build(
        prediction_client: StubPredictionClient | None = None,
        store: SQLiteEstimateStore | None = None,
        database_path: Path | None = None,
    ):
        selected_path = database_path or tmp_path / "estimator.db"
        selected_store = store or SQLiteEstimateStore(selected_path)
        selected_prediction_client = prediction_client or StubPredictionClient()
        return (
            create_app(
                prediction_client=selected_prediction_client,
                store=selected_store,
            ),
            selected_store,
            selected_prediction_client,
        )

    return build
