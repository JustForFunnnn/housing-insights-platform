from __future__ import annotations

import logging
from collections.abc import Sequence
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from prediction_service.api import create_app
from prediction_service.artifact import ArtifactError, save_artifact
from prediction_service.constants import FEATURE_NAMES, REQUEST_ID_HEADER
from prediction_service.models import (
    CrossValidationInfo,
    HousingFeatures,
    MetricSummary,
    ModelInfo,
    RegressionMetrics,
)

VALID_INSTANCE = {
    "square_footage": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1998,
    "lot_size": 7500,
    "distance_to_city_center": 5.6,
    "school_rating": 8.2,
}


class StubPredictionService:
    def __init__(self, *, error: Exception | None = None) -> None:
        self.error = error
        self.seen: list[list[HousingFeatures]] = []

    def predict(self, instances: Sequence[HousingFeatures]) -> list[int]:
        self.seen.append(list(instances))
        if self.error is not None:
            raise self.error
        return [round(instance.square_footage) for instance in instances]

    def model_info(self) -> ModelInfo:
        summary = MetricSummary(mean=1.0, std=0.1)
        return ModelInfo(
            training_timestamp="2026-07-21T12:00:00+00:00",
            algorithm="LinearRegression",
            features=FEATURE_NAMES,
            intercept=1000,
            coefficients={name: 1.0 for name in FEATURE_NAMES},
            cross_validation=CrossValidationInfo(
                folds=5,
                shuffle=True,
                random_state=42,
                metrics=RegressionMetrics(
                    r2=summary,
                    rmse=summary,
                    mae=summary,
                ),
            ),
        )


def test_api_contract_and_swagger() -> None:
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        health = client.get("/health")
        info = client.get("/model-info")
        openapi = client.get("/openapi.json")
        docs = client.get("/docs")

    assert health.json() == {"status": "ok"}
    assert info.json()["training_timestamp"] == "2026-07-21T12:00:00+00:00"
    assert info.json()["cross_validation"]["folds"] == 5
    assert set(openapi.json()["paths"]) == {"/health", "/model-info", "/predict"}
    prediction_items = openapi.json()["components"]["schemas"]["PredictionResponse"][
        "properties"
    ]["predictions"]["items"]
    assert prediction_items == {"type": "integer", "format": "int64"}
    predict_responses = openapi.json()["paths"]["/predict"]["post"]["responses"]
    assert predict_responses["422"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ErrorResponse"
    }
    assert predict_responses["500"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ErrorResponse"
    }
    assert docs.status_code == 200


def test_supplied_request_id_is_returned_and_logged(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO, logger="prediction_service.observability")
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        response = client.get(
            "/health",
            headers={REQUEST_ID_HEADER: "upstream-request-123"},
        )
        generated = client.get("/health")

    record = next(
        record for record in caplog.records if "request_completed" in record.message
    )
    assert response.headers[REQUEST_ID_HEADER] == "upstream-request-123"
    assert "request_id=upstream-request-123" in record.message
    assert "method=GET path=/health status=200" in record.message
    assert len(generated.headers[REQUEST_ID_HEADER]) == 32
    assert generated.headers[REQUEST_ID_HEADER] != "upstream-request-123"


def test_single_and_batch_predictions_always_use_list_envelope() -> None:
    service = StubPredictionService()
    with TestClient(create_app(prediction_service=service)) as client:
        single = client.post("/predict", json={"instances": [VALID_INSTANCE]})
        batch = client.post(
            "/predict",
            json={
                "instances": [
                    {**VALID_INSTANCE, "square_footage": 2100},
                    {**VALID_INSTANCE, "square_footage": 900},
                ]
            },
        )
        bare = client.post("/predict", json={"instances": VALID_INSTANCE})

    assert single.json() == {"predictions": [1850], "count": 1}
    assert batch.json() == {"predictions": [2100, 900], "count": 2}
    assert bare.status_code == 422
    assert service.seen[0][0] == HousingFeatures(**VALID_INSTANCE)


def test_validation_error_uses_standard_response_and_request_id() -> None:
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        response = client.post(
            "/predict",
            json={},
            headers={REQUEST_ID_HEADER: "validation-request"},
        )

    assert response.status_code == 422
    assert response.headers[REQUEST_ID_HEADER] == "validation-request"
    assert response.json() == {
        "error_code": "validation_error",
        "message": "Request validation failed.",
    }


def test_non_finite_request_returns_serializable_422() -> None:
    body = (
        '{"instances":[{"square_footage":1850,"bedrooms":3,'
        '"bathrooms":2,"year_built":1998,"lot_size":7500,'
        '"distance_to_city_center":5.6,"school_rating":NaN}]}'
    )
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        response = client.post(
            "/predict",
            content=body,
            headers={"content-type": "application/json"},
        )

    assert response.status_code == 422
    assert response.json()["error_code"] == "validation_error"


def test_http_errors_use_standard_safe_responses() -> None:
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        missing = client.get(
            "/missing",
            headers={REQUEST_ID_HEADER: "missing-route-request"},
        )
        wrong_method = client.get(
            "/predict",
            headers={REQUEST_ID_HEADER: "wrong-method-request"},
        )

    assert missing.status_code == 404
    assert missing.json() == {
        "error_code": "http_error",
        "message": "The request could not be completed.",
    }
    assert missing.headers[REQUEST_ID_HEADER] == "missing-route-request"
    assert wrong_method.status_code == 405
    assert wrong_method.headers["allow"] == "POST"
    assert wrong_method.json() == {
        "error_code": "http_error",
        "message": "The request could not be completed.",
    }


def test_failure_is_logged_and_returns_safe_standard_response(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.ERROR, logger="prediction_service.api")
    error = RuntimeError("secret model failure")
    app = create_app(prediction_service=StubPredictionService(error=error))
    request_id = "internal-error-request"
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/predict",
            json={"instances": [VALID_INSTANCE]},
            headers={REQUEST_ID_HEADER: request_id},
        )

    record = next(
        record for record in caplog.records if "request_failed" in record.message
    )
    assert f"error={error}" in record.message
    assert record.exc_info is not None
    assert record.exc_info[0] is type(error)
    assert f"request_id={request_id}" in record.message
    assert "status=500" in record.message
    assert response.status_code == 500
    assert response.headers[REQUEST_ID_HEADER] == request_id
    assert response.json() == {
        "error_code": "internal_error",
        "message": "An unexpected server error occurred.",
    }
    assert "secret" not in response.text


def test_app_loads_explicit_artifact_path(
    tmp_path: Path,
    artifact_factory,
) -> None:
    path = tmp_path / "configured.joblib"
    artifact = artifact_factory()
    artifact["trained_at"] = "2001-02-03T04:05:06+00:00"
    save_artifact(artifact, path)

    with TestClient(create_app(artifact_path=str(path))) as client:
        response = client.get("/model-info")

    assert response.status_code == 200
    assert response.json()["training_timestamp"] == artifact["trained_at"]


def test_app_loads_default_artifact(
    tmp_path: Path,
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    path = Path("artifacts/model_pipeline.joblib")
    save_artifact(artifact_factory(), path)

    with TestClient(create_app()) as client:
        response = client.get("/model-info")

    assert response.status_code == 200


def test_missing_artifact_logs_context_and_preserves_cause(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    path = tmp_path / "missing.joblib"
    caplog.set_level(logging.ERROR, logger="prediction_service.api")

    with pytest.raises(RuntimeError, match="could not start without model") as caught:
        with TestClient(create_app(artifact_path=str(path))):
            pass

    record = next(
        record for record in caplog.records if "model_load_failed" in record.message
    )
    assert "error=model artifact does not exist" in record.message
    assert record.exc_info is None
    assert isinstance(caught.value.__cause__, ArtifactError)
