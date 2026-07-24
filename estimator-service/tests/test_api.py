from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from uuid import UUID

import httpx2
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

from estimator_service.constants import MAX_PAGE_LIMIT, MAX_SQUARE_FOOTAGE
from estimator_service.errors import (
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
    StorageUnavailableError,
)
from tests.conftest import VALID_PROPERTY, StubPredictionClient

HYPHENATED_REQUEST_ID = "123E4567-E89B-42D3-A456-426614174000"
SUPPLIED_REQUEST_ID = "123e4567e89b42d3a456426614174000"
INVALID_REQUEST_ID = "estimate-request-123"


def test_health_contract(app_factory) -> None:
    app, _store, _prediction = app_factory()
    with TestClient(app) as client:
        health = client.get("/health")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}


def test_create_single_and_batch_estimates_and_propagate_request_id(
    app_factory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO, logger="estimator_service.observability")
    prediction = StubPredictionClient()
    app, _store, _prediction = app_factory(prediction_client=prediction)
    with TestClient(app) as client:
        single = client.post(
            "/estimates",
            json={"properties": [VALID_PROPERTY]},
            headers={"X-Request-ID": HYPHENATED_REQUEST_ID},
        )
        batch = client.post(
            "/estimates",
            json={
                "properties": [
                    {**VALID_PROPERTY, "square_footage": 900},
                    {**VALID_PROPERTY, "square_footage": 2100},
                ]
            },
        )
        replaced = client.post(
            "/estimates",
            json={"properties": [VALID_PROPERTY]},
            headers={"X-Request-ID": INVALID_REQUEST_ID},
        )

    assert single.status_code == 201
    assert single.headers["X-Request-ID"] == HYPHENATED_REQUEST_ID
    assert single.json()["count"] == 1
    record = single.json()["estimates"][0]
    assert UUID(record["id"])
    assert record["property"] == VALID_PROPERTY
    assert record["estimated_price"] == 185000
    assert datetime.fromisoformat(record["created_at"])
    assert batch.status_code == 201
    assert [item["estimated_price"] for item in batch.json()["estimates"]] == [
        90000,
        210000,
    ]
    assert prediction.calls[0][1] == HYPHENATED_REQUEST_ID
    batch_request_id = batch.headers["X-Request-ID"]
    assert UUID(batch_request_id).version == 4
    assert batch_request_id == UUID(batch_request_id).hex
    assert replaced.status_code == 201
    replaced_request_id = replaced.headers["X-Request-ID"]
    assert UUID(replaced_request_id).version == 4
    assert replaced_request_id == UUID(replaced_request_id).hex
    assert replaced_request_id != INVALID_REQUEST_ID
    assert len(
        {HYPHENATED_REQUEST_ID, batch_request_id, replaced_request_id}
    ) == 3
    assert prediction.calls[2][1] == replaced_request_id
    request_records = {
        record.correlation_id: record
        for record in caplog.records
        if "request_completed" in record.message
    }
    assert {
        HYPHENATED_REQUEST_ID,
        batch_request_id,
        replaced_request_id,
    } <= request_records.keys()
    for request_id in (
        HYPHENATED_REQUEST_ID,
        batch_request_id,
        replaced_request_id,
    ):
        assert (
            "method=POST path=/estimates status=201"
            in request_records[request_id].message
        )


def test_history_detail_pagination_and_out_of_range_offset(app_factory) -> None:
    app, _store, _prediction = app_factory()
    with TestClient(app) as client:
        first = client.post(
            "/estimates",
            json={"properties": [{**VALID_PROPERTY, "square_footage": 1000}]},
        ).json()["estimates"][0]
        second = client.post(
            "/estimates",
            json={
                "properties": [
                    {**VALID_PROPERTY, "square_footage": 2000},
                    {**VALID_PROPERTY, "square_footage": 3000},
                ]
            },
        ).json()["estimates"]

        page = client.get("/estimates", params={"limit": 2, "offset": 0})
        equal_total = client.get("/estimates", params={"offset": 3})
        past_total = client.get("/estimates", params={"offset": 50})
        detail = client.get(f"/estimates/{first['id']}")
        missing = client.get("/estimates/00000000-0000-0000-0000-000000000000")

    assert page.status_code == 200
    assert page.json()["count"] == 2
    assert page.json()["total"] == 3
    expected = sorted(
        [first, *second],
        key=lambda item: (datetime.fromisoformat(item["created_at"]), item["id"]),
        reverse=True,
    )[:2]
    assert page.json()["estimates"] == expected
    for response in (equal_total, past_total):
        assert response.status_code == 200
        assert response.json()["estimates"] == []
        assert response.json()["count"] == 0
        assert response.json()["total"] == 3
    assert detail.json() == first
    assert missing.status_code == 404
    assert missing.json()["error_code"] == "estimate_not_found"


def test_history_persists_across_application_restarts(
    app_factory,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "persistent.db"
    first_app, _first_store, _prediction = app_factory(
        database_path=database_path
    )
    with TestClient(first_app) as client:
        created = client.post(
            "/estimates",
            json={"properties": [VALID_PROPERTY]},
        ).json()["estimates"][0]

    second_app, _second_store, _prediction = app_factory(
        database_path=database_path
    )
    with TestClient(second_app) as client:
        history = client.get("/estimates")
        detail = client.get(f"/estimates/{created['id']}")

    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["estimates"] == [created]
    assert detail.json() == created


def test_validation_and_http_errors_use_safe_contract(app_factory) -> None:
    app, _store, _prediction = app_factory()
    with TestClient(app) as client:
        invalid = client.post(
            "/estimates",
            json={"properties": []},
            headers={"X-Request-ID": SUPPLIED_REQUEST_ID},
        )
        invalid_uuid = client.get("/estimates/not-a-uuid")
        missing_route = client.get("/missing")
        invalid_limit = client.get(
            "/estimates",
            params={"limit": MAX_PAGE_LIMIT + 1},
        )

    assert invalid.status_code == 422
    assert invalid.headers["X-Request-ID"] == SUPPLIED_REQUEST_ID
    assert invalid.json() == {
        "error_code": "validation_error",
        "message": "Request validation failed.",
    }
    assert invalid_uuid.status_code == 422
    assert invalid_uuid.json()["error_code"] == "validation_error"
    assert missing_route.status_code == 404
    assert missing_route.json()["error_code"] == "http_error"
    assert invalid_limit.status_code == 422
    assert invalid_limit.json()["error_code"] == "validation_error"


def test_feature_above_static_limit_returns_422(app_factory) -> None:
    app, _store, prediction = app_factory()
    payload = {
        "properties": [
            {
                **VALID_PROPERTY,
                "square_footage": MAX_SQUARE_FOOTAGE + 1,
            }
        ]
    }
    with TestClient(app) as client:
        response = client.post("/estimates", json=payload)

    assert response.status_code == 422
    assert response.json()["error_code"] == "validation_error"
    assert prediction.calls == []


@pytest.mark.parametrize(
    ("error", "status_code", "error_code"),
    [
        (
            PredictionServiceUnavailableError("secret offline details"),
            503,
            "prediction_service_unavailable",
        ),
        (
            PredictionServiceInvalidResponseError("secret invalid response"),
            502,
            "prediction_service_invalid_response",
        ),
    ],
)
def test_prediction_failures_are_safe(
    app_factory,
    error: Exception,
    status_code: int,
    error_code: str,
) -> None:
    app, _store, _prediction = app_factory(
        prediction_client=StubPredictionClient(error=error)
    )
    with TestClient(app) as client:
        response = client.post(
            "/estimates",
            json={"properties": [VALID_PROPERTY]},
        )

    assert response.status_code == status_code
    assert response.json()["error_code"] == error_code
    assert "secret" not in response.text


def test_health_ignores_prediction_service_but_estimates_return_503(
    app_factory,
) -> None:
    app, _store, _prediction = app_factory(
        prediction_client=StubPredictionClient(
            error=PredictionServiceUnavailableError("offline")
        )
    )
    with TestClient(app) as client:
        health = client.get("/health")
        estimate = client.post(
            "/estimates",
            json={"properties": [VALID_PROPERTY]},
        )

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert estimate.status_code == 503


def test_health_returns_503_when_database_becomes_unavailable(
    app_factory,
    tmp_path: Path,
) -> None:
    database_directory = tmp_path / "health-database"
    database_path = database_directory / "estimator.db"
    app, _store, _prediction = app_factory(database_path=database_path)
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200
        for path in database_directory.iterdir():
            path.unlink()
        database_directory.rmdir()
        database_directory.write_text("blocked", encoding="utf-8")
        response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["error_code"] == "database_unavailable"


def test_startup_does_not_create_an_uninitialized_database(
    app_factory,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "uninitialized.db"
    app, _store, _prediction = app_factory(
        database_path=database_path,
        initialize_schema=False,
    )

    with pytest.raises(StorageUnavailableError, match="not been initialized"):
        with TestClient(app):
            pass
    assert not database_path.exists()


def test_second_insert_failure_rolls_back_first_insert(
    app_factory,
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.ERROR, logger="estimator_service.app")
    database_path = tmp_path / "rollback.db"
    app, _store, _prediction = app_factory(database_path=database_path)
    engine = create_engine(
        URL.create(
            "sqlite+pysqlite",
            database=str(database_path.resolve()),
        )
    )
    with TestClient(app, raise_server_exceptions=False) as client:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                CREATE TRIGGER fail_second_test_insert
                BEFORE INSERT ON estimates
                WHEN NEW.square_footage = 9999
                BEGIN
                    SELECT RAISE(ABORT, 'forced second insert failure');
                END
                """
                )
            )
        response = client.post(
            "/estimates",
            json={
                "properties": [
                    {**VALID_PROPERTY, "square_footage": 1000},
                    {**VALID_PROPERTY, "square_footage": 9999},
                ]
            },
        )

    with engine.connect() as connection:
        count = connection.execute(
            text("SELECT COUNT(*) FROM estimates")
        ).scalar_one()
    engine.dispose()

    assert response.status_code == 500
    assert response.json()["error_code"] == "internal_error"
    assert count == 0
    record = next(
        record
        for record in caplog.records
        if "database_operation_failed" in record.message
    )
    assert record.exc_info is None
    assert "could not persist estimate batch" in record.message
    assert "1000" not in caplog.text
    assert "9999" not in caplog.text
    assert "100000" not in caplog.text
    assert "999900" not in caplog.text


@pytest.mark.anyio
async def test_concurrent_batches_do_not_leak_database_locked_errors(
    app_factory,
) -> None:
    app, _store, _prediction = app_factory()
    async with app.router.lifespan_context(app):
        transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
        async with httpx2.AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            responses = await asyncio.gather(
                *(
                    client.post(
                        "/estimates",
                        json={
                            "properties": [
                                {**VALID_PROPERTY, "square_footage": 1000 + index},
                                {**VALID_PROPERTY, "square_footage": 2000 + index},
                            ]
                        },
                    )
                    for index in range(12)
                )
            )
            history = await client.get(
                "/estimates",
                params={"limit": MAX_PAGE_LIMIT},
            )

    assert [response.status_code for response in responses] == [201] * 12
    assert all("database is locked" not in response.text for response in responses)
    assert history.status_code == 200
    assert history.json()["total"] == 24


def test_request_log_contains_correlation_but_not_housing_data(
    app_factory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO, logger="estimator_service.observability")
    app, _store, _prediction = app_factory()
    with TestClient(app) as client:
        response = client.post(
            "/estimates",
            json={"properties": [VALID_PROPERTY]},
            headers={"X-Request-ID": SUPPLIED_REQUEST_ID},
        )

    request_record = next(
        record for record in caplog.records if "request_completed" in record.message
    )
    assert request_record.correlation_id == SUPPLIED_REQUEST_ID
    assert "method=POST path=/estimates status=201" in request_record.message
    assert "1850" not in request_record.message
    assert (
        str(response.json()["estimates"][0]["estimated_price"])
        not in request_record.message
    )
