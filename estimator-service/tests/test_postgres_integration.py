from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from sqlalchemy import delete
from sqlalchemy.engine import make_url

from estimator_service.data_access import (
    PostgresDatabase,
    PostgresEstimateStore,
)
from estimator_service.errors import StorageError
from estimator_service.models import EstimateRecord, PropertyFeatures
from estimator_service.tables import EstimateRow

TEST_DATABASE_ENV = "ESTIMATOR_TEST_DATABASE_URL"


def estimate(
    square_footage: float,
    estimated_price: int,
    created_at: datetime,
) -> EstimateRecord:
    return EstimateRecord(
        property=PropertyFeatures(
            square_footage=square_footage,
            bedrooms=3,
            bathrooms=2,
            year_built=2000,
            lot_size=7000,
            distance_to_city_center=5,
            school_rating=8,
        ),
        estimated_price=estimated_price,
        created_at=created_at,
    )


@pytest.fixture
async def postgres_store() -> AsyncGenerator[PostgresEstimateStore, None]:
    database_url = os.getenv(TEST_DATABASE_ENV)
    if not database_url:
        pytest.skip(f"{TEST_DATABASE_ENV} is not configured")

    database_name = make_url(database_url).database or ""
    if "test" not in database_name.lower():
        pytest.fail(
            f"{TEST_DATABASE_ENV} must target a database whose name contains 'test'"
        )

    database = PostgresDatabase(database_url)
    initialized = False
    try:
        await database.initialize_schema()
        initialized = True
        async with database.transaction() as session:
            await session.execute(delete(EstimateRow))
        yield PostgresEstimateStore(database)
    finally:
        try:
            if initialized:
                async with database.transaction() as session:
                    await session.execute(delete(EstimateRow))
        finally:
            await database.aclose()


@pytest.mark.anyio
@pytest.mark.integration
async def test_batch_constraint_failure_rolls_back_every_record(
    postgres_store: PostgresEstimateStore,
) -> None:
    timestamp = datetime(2026, 7, 26, 12, tzinfo=UTC)

    with pytest.raises(StorageError, match="persist estimate batch"):
        await postgres_store.insert_many(
            [
                estimate(1200, 180000, timestamp),
                estimate(1800, 0, timestamp),
            ]
        )

    records, total = await postgres_store.list_page(limit=20, offset=0)

    assert records == ()
    assert total == 0


@pytest.mark.anyio
@pytest.mark.integration
async def test_same_timestamp_uses_id_for_stable_pagination(
    postgres_store: PostgresEstimateStore,
) -> None:
    timestamp = datetime(2026, 7, 26, 12, tzinfo=UTC)
    await postgres_store.insert_many(
        [
            estimate(1200, 180000, timestamp),
            estimate(1800, 280000, timestamp),
            estimate(2200, 380000, timestamp),
        ]
    )

    first_page, total = await postgres_store.list_page(limit=2, offset=0)
    second_page, second_total = await postgres_store.list_page(
        limit=2,
        offset=2,
    )

    assert [record.estimated_price for record in first_page] == [
        380000,
        280000,
    ]
    assert [record.estimated_price for record in second_page] == [180000]
    assert total == 3
    assert second_total == 3
