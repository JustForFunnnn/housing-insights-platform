from __future__ import annotations

from collections.abc import Sequence

import pytest

from estimator_service.app import create_app
from estimator_service.data_access import EstimateStore
from estimator_service.errors import StorageError, StorageUnavailableError
from estimator_service.models import EstimateRecord, PropertyFeatures
from estimator_service.observability import current_request_id

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
        schema_initialized: bool = True,
        fail_on_square_footage: float | None = None,
    ) -> None:
        self.schema_initialized = schema_initialized
        self.fail_on_square_footage = fail_on_square_footage
        self.available = True
        self.records: list[EstimateRecord] = []

    async def initialize_schema(self) -> None:
        await self.health()
        self.schema_initialized = True

    async def aclose(self) -> None:
        return None

    async def health(self) -> None:
        if not self.available:
            raise StorageUnavailableError("database is unavailable")

    async def insert_many(self, records: Sequence[EstimateRecord]) -> None:
        await self.health()
        if self.fail_on_square_footage is not None and any(
            record.property.square_footage == self.fail_on_square_footage
            for record in records
        ):
            raise StorageError("could not persist estimate batch")
        self.records.extend(records)

    async def list_page(
        self,
        limit: int,
        offset: int,
    ) -> tuple[tuple[EstimateRecord, ...], int]:
        await self.health()
        records = sorted(
            enumerate(self.records, start=1),
            key=lambda item: (item[1].created_at, item[0]),
            reverse=True,
        )
        page = tuple(
            record for _id, record in records[offset : offset + limit]
        )
        return page, len(records)


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def app_factory():
    def build(
        prediction_client: StubPredictionClient | None = None,
        store: EstimateStore | None = None,
        initialize_schema: bool = True,
    ):
        if store is None:
            store = InMemoryEstimateStore(
                schema_initialized=initialize_schema,
            )
        if prediction_client is None:
            prediction_client = StubPredictionClient()
        return (
            create_app(
                prediction_client=prediction_client,
                store=store,
            ),
            store,
            prediction_client,
        )

    return build
