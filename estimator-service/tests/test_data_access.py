from datetime import datetime, timezone

import pytest

from estimator_service.data_access import PostgresDatabase, PostgresEstimateStore
from estimator_service.models import EstimateRecord, PropertyFeatures


def test_database_rejects_non_postgresql_driver() -> None:
    with pytest.raises(ValueError, match="postgresql\\+asyncpg"):
        PostgresDatabase("postgresql://user:pass@localhost:5432/estimator")


def test_record_round_trips_through_orm_row() -> None:
    record = EstimateRecord(
        property=PropertyFeatures(
            square_footage=1850,
            bedrooms=3,
            bathrooms=2,
            year_built=1998,
            lot_size=7500,
            distance_to_city_center=5.6,
            school_rating=8.2,
        ),
        estimated_price=185000,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    row = PostgresEstimateStore._row_from_record(record)

    assert PostgresEstimateStore._record_from_row(row) == record
