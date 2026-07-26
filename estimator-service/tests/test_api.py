from __future__ import annotations

import logging
from datetime import datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from estimator_service.constants import MAX_PAGE_LIMIT
from estimator_service.errors import (
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
    StorageUnavailableError,
)
from estimator_service.property_metadata import PROPERTY_METADATA
from tests.conftest import (
    VALID_PROPERTY,
    InMemoryEstimateStore,
    StubPredictionClient,
)

HYPHENATED_REQUEST_ID = "123E4567-E89B-42D3-A456-426614174000"
SUPPLIED_REQUEST_ID = "123e4567e89b42d3a456426614174000"
INVALID_REQUEST_ID = "estimate-request-123"


def test_create_single_and_batch_estimates_and_propagate_request_id(
    app_factory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO, logger="estimator_service.app")
    prediction = StubPredictionClient()
    app, _database, _store, _prediction = app_factory(prediction_client=prediction)
    with TestClient(app) as client:
        single = client.post(
            "/api/estimates",
            json={"properties": [VALID_PROPERTY]},
            headers={"X-Request-ID": HYPHENATED_REQUEST_ID},
        )
        batch = client.post(
            "/api/estimates",
            json={
                "properties": [
                    {**VALID_PROPERTY, "square_footage": 900},
                    {**VALID_PROPERTY, "square_footage": 2100},
                ]
            },
        )
        replaced = client.post(
            "/api/estimates",
            json={"properties": [VALID_PROPERTY]},
            headers={"X-Request-ID": INVALID_REQUEST_ID},
        )

    assert single.status_code == 201
    assert single.headers["X-Request-ID"] == HYPHENATED_REQUEST_ID
    record = single.json()["estimates"][0]
    assert "id" not in record
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
    assert len({HYPHENATED_REQUEST_ID, batch_request_id, replaced_request_id}) == 3
    assert prediction.calls[2][1] == replaced_request_id
    request_records = {
        record.correlation_id: record for record in caplog.records if "request_completed" in record.message
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
        assert "method=POST path=/api/estimates status=201" in request_records[request_id].message


def test_history_pagination_and_out_of_range_offset(app_factory) -> None:
    app, _database, _store, _prediction = app_factory()
    with TestClient(app) as client:
        client.post(
            "/api/estimates",
            json={"properties": [{**VALID_PROPERTY, "square_footage": 1000}]},
        )
        second = client.post(
            "/api/estimates",
            json={
                "properties": [
                    {**VALID_PROPERTY, "square_footage": 2000},
                    {**VALID_PROPERTY, "square_footage": 3000},
                ]
            },
        ).json()["estimates"]

        page = client.get("/api/estimates", params={"limit": 2, "offset": 0})
        past_total = client.get("/api/estimates", params={"offset": 50})

    assert page.status_code == 200
    assert page.json()["total"] == 3
    assert page.json()["limit"] == 2
    assert page.json()["offset"] == 0
    estimates = page.json()["estimates"]
    assert {estimate["estimated_price"] for estimate in estimates} == {200000, 300000}
    timestamps = [datetime.fromisoformat(estimate["created_at"]) for estimate in estimates]
    assert timestamps == sorted(timestamps, reverse=True)
    assert past_total.status_code == 200
    assert past_total.json()["estimates"] == []
    assert past_total.json()["total"] == 3


def test_validation_and_http_errors_use_contract(app_factory) -> None:
    app, _database, _store, _prediction = app_factory()
    with TestClient(app) as client:
        invalid = client.post(
            "/api/estimates",
            json={"properties": []},
            headers={"X-Request-ID": SUPPLIED_REQUEST_ID},
        )
        missing_route = client.get("/missing")
        invalid_limit = client.get(
            "/api/estimates",
            params={"limit": MAX_PAGE_LIMIT + 1},
        )

    assert invalid.status_code == 422
    assert invalid.headers["X-Request-ID"] == SUPPLIED_REQUEST_ID
    assert invalid.json() == {
        "error_code": "validation_error",
        "message": "Request validation failed.",
    }
    assert missing_route.status_code == 404
    assert missing_route.json() == {
        "error_code": "http_error",
        "message": "The request could not be completed.",
    }
    assert invalid_limit.status_code == 422
    assert invalid_limit.json() == {
        "error_code": "validation_error",
        "message": "Request validation failed.",
    }


def test_metadata_returns_defined_property_features(app_factory) -> None:
    app, _database, _store, _prediction = app_factory()
    with TestClient(app) as client:
        response = client.get("/api/metadata")

    assert response.status_code == 200
    assert response.json() == {
        "features": PROPERTY_METADATA.features.model_dump(mode="json"),
        "price_currency": PROPERTY_METADATA.price_currency,
    }


def test_openapi_exposes_shared_metadata_constraints(app_factory) -> None:
    app, _database, _store, _prediction = app_factory()
    with TestClient(app) as client:
        schemas = client.get("/openapi.json").json()["components"]["schemas"]

    property_input = schemas["PropertyInput"]["properties"]
    square_footage = PROPERTY_METADATA.features.square_footage
    if square_footage.min is None:
        assert "minimum" not in property_input["square_footage"]
    else:
        assert property_input["square_footage"]["minimum"] == square_footage.min
    if square_footage.max is None:
        assert "maximum" not in property_input["square_footage"]
    else:
        assert property_input["square_footage"]["maximum"] == square_footage.max
    assert "multipleOf" not in property_input["bathrooms"]
    assert "multipleOf" not in property_input["school_rating"]

    metadata_features = schemas["PropertyMetadataFeaturesResponse"]
    expected_metadata_features = set(VALID_PROPERTY)
    assert set(metadata_features["properties"]) == expected_metadata_features
    assert set(metadata_features["required"]) == expected_metadata_features
    assert metadata_features["additionalProperties"] is False


def test_cors_exposes_request_id(app_factory) -> None:
    app, _database, _store, _prediction = app_factory()

    with TestClient(app) as client:
        response = client.post(
            "/api/estimates",
            headers={"Origin": "http://localhost:9100"},
            json={"properties": []},
        )

    assert response.status_code == 422
    assert "X-Request-ID" in response.headers
    exposed_headers = {header.strip() for header in response.headers["Access-Control-Expose-Headers"].split(",")}
    assert "X-Request-ID" in exposed_headers


@pytest.mark.parametrize(
    ("error", "status_code", "expected_response", "log_event"),
    [
        (
            PredictionServiceUnavailableError("prediction service unavailable"),
            503,
            {
                "error_code": "prediction_service_unavailable",
                "message": "Price estimation is temporarily unavailable.",
            },
            "prediction_unavailable",
        ),
        (
            PredictionServiceInvalidResponseError("invalid prediction response"),
            502,
            {
                "error_code": "prediction_service_invalid_response",
                "message": "The prediction service returned an invalid response.",
            },
            "prediction_invalid_response",
        ),
    ],
)
def test_prediction_failures_are_logged_and_mapped(
    app_factory,
    caplog: pytest.LogCaptureFixture,
    error: Exception,
    status_code: int,
    expected_response: dict[str, str],
    log_event: str,
) -> None:
    caplog.set_level(logging.ERROR, logger="estimator_service.app")
    app, _database, _store, _prediction = app_factory(prediction_client=StubPredictionClient(error=error))
    with TestClient(app) as client:
        response = client.post(
            "/api/estimates",
            json={"properties": [VALID_PROPERTY]},
        )

    assert response.status_code == status_code
    assert response.json() == expected_response
    record = next(record for record in caplog.records if log_event in record.message)
    assert record.exc_info is not None
    assert record.exc_info[1] is error


def test_health_ignores_prediction_service_but_estimates_return_503(
    app_factory,
) -> None:
    app, _database, _store, _prediction = app_factory(
        prediction_client=StubPredictionClient(error=PredictionServiceUnavailableError("offline"))
    )
    with TestClient(app) as client:
        health = client.get("/api/health")
        estimate = client.post(
            "/api/estimates",
            json={"properties": [VALID_PROPERTY]},
        )

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert estimate.status_code == 503
    assert estimate.json() == {
        "error_code": "prediction_service_unavailable",
        "message": "Price estimation is temporarily unavailable.",
    }


def test_health_returns_503_when_database_becomes_unavailable(app_factory) -> None:
    app, database, _store, _prediction = app_factory()
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
        database.health.side_effect = StorageUnavailableError("database is unavailable")
        response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {
        "error_code": "database_unavailable",
        "message": "The estimator database is temporarily unavailable.",
    }


def test_startup_initializes_schema(app_factory) -> None:
    app, database, _store, _prediction = app_factory()

    database.initialize_schema.assert_not_awaited()
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
    database.initialize_schema.assert_awaited_once_with()


def test_store_failure_returns_500_without_partial_history(
    app_factory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.ERROR, logger="estimator_service.app")
    store = InMemoryEstimateStore(
        fail_on_square_footage=9999,
    )
    app, _database, _store, _prediction = app_factory(store=store)
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/estimates",
            json={
                "properties": [
                    {**VALID_PROPERTY, "square_footage": 1000},
                    {**VALID_PROPERTY, "square_footage": 9999},
                ]
            },
        )

    assert response.status_code == 500
    assert response.json() == {
        "error_code": "internal_error",
        "message": "An unexpected server error occurred.",
    }
    assert store.records == []
    record = next(record for record in caplog.records if "database_operation_failed" in record.message)
    assert record.exc_info is not None
    assert str(record.exc_info[1]) == "could not persist estimate batch"
    assert "could not persist estimate batch" in record.message
