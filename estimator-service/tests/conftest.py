from __future__ import annotations

from collections.abc import Sequence
from unittest.mock import AsyncMock

import pytest
from housing_common.observability import current_request_id

from estimator_service import domain
from estimator_service.app import create_app
from estimator_service.data_access import Database, EstimateStore
from estimator_service.errors import StorageError

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
        self.calls: list[tuple[list[domain.PropertyFeatures], str]] = []

    async def predict(
        self,
        properties: Sequence[domain.PropertyFeatures],
    ) -> list[int]:
        captured = list(properties)
        self.calls.append((captured, current_request_id()))
        if self.error is not None:
            raise self.error
        return [round(item.square_footage * 100) for item in captured]


class InMemoryEstimateStore:
    def __init__(
        self,
        *,
        fail_on_square_footage: float | None = None,
    ) -> None:
        self.fail_on_square_footage = fail_on_square_footage
        self.estimates: list[domain.Estimate] = []

    async def insert_many(self, estimates: Sequence[domain.Estimate]) -> None:
        if self.fail_on_square_footage is not None and any(
            estimate.property_features.square_footage == self.fail_on_square_footage for estimate in estimates
        ):
            raise StorageError("could not persist estimate batch")
        self.estimates.extend(estimates)

    async def list_page(
        self,
        limit: int,
        offset: int,
    ) -> tuple[tuple[domain.Estimate, ...], int]:
        estimates = sorted(
            enumerate(self.estimates, start=1),
            key=lambda item: (item[1].created_at, item[0]),
            reverse=True,
        )
        page = tuple(estimate for _id, estimate in estimates[offset : offset + limit])
        return page, len(estimates)


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def app_factory():
    def build(
        prediction_client: StubPredictionClient | None = None,
        database: Database | None = None,
        store: EstimateStore | None = None,
    ):
        if database is None:
            database = AsyncMock(spec=Database)
        if store is None:
            store = InMemoryEstimateStore()
        if prediction_client is None:
            prediction_client = StubPredictionClient()
        return (
            create_app(
                prediction_client=prediction_client,
                database=database,
                store=store,
            ),
            database,
            store,
            prediction_client,
        )

    return build
