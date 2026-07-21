from __future__ import annotations

import logging
from collections.abc import Sequence
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from prediction_service.api import create_app
from prediction_service.artifact import ArtifactError, save_artifact
from prediction_service.models import (
    FEATURE_NAMES,
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
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.seen: list[list[HousingFeatures]] = []

    def predict(self, instances: Sequence[HousingFeatures]) -> list[float]:
        self.seen.append(list(instances))
        if self.fail:
            raise RuntimeError("secret model failure")
        return [instance.square_footage for instance in instances]

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
    assert docs.status_code == 200


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

    assert single.json() == {"predictions": [1850.0], "count": 1}
    assert batch.json() == {"predictions": [2100.0, 900.0], "count": 2}
    assert bare.status_code == 422
    assert service.seen[0][0] == HousingFeatures(**VALID_INSTANCE)


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"instances": []},
        {"instances": [{**VALID_INSTANCE, "square_footage": "1850"}]},
        {"instances": [{**VALID_INSTANCE, "school_rating": 11}]},
    ],
)
def test_invalid_requests_return_422(payload: dict[str, object]) -> None:
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        response = client.post("/predict", json=payload)

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


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
    assert isinstance(response.json()["detail"], list)


def test_request_log_contains_endpoint_status_parameters_and_duration(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO, logger="prediction_service.api")
    with TestClient(create_app(prediction_service=StubPredictionService())) as client:
        response = client.post("/predict", json={"instances": [VALID_INSTANCE]})

    record = next(
        record for record in caplog.records if "request_complete" in record.message
    )
    assert response.status_code == 200
    assert "endpoint=/predict" in record.message
    assert "status=200" in record.message
    assert '"square_footage": 1850' in record.message
    assert "duration_ms=" in record.message


def test_unexpected_failure_logs_error_and_traceback(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.ERROR, logger="prediction_service.api")
    app = create_app(prediction_service=StubPredictionService(fail=True))
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post("/predict", json={"instances": [VALID_INSTANCE]})

    record = next(
        record for record in caplog.records if "request_failed" in record.message
    )
    assert "error=secret model failure" in record.message
    assert record.exc_info is not None
    assert record.exc_info[0] is RuntimeError
    assert response.status_code == 500
    assert response.json() == {"detail": "An unexpected server error occurred."}
    assert "secret" not in response.text


def test_app_loads_configured_artifact(
    tmp_path: Path,
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = tmp_path / "configured.joblib"
    save_artifact(artifact_factory(), path)
    monkeypatch.setenv("MODEL_ARTIFACT_PATH", str(path))

    with TestClient(create_app()) as client:
        response = client.get("/model-info")

    assert response.status_code == 200


def test_app_loads_default_artifact(
    tmp_path: Path,
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    path = Path("artifacts/model_pipeline.joblib")
    save_artifact(artifact_factory(), path)

    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200


def test_startup_logs_context_and_propagates_traceback_once(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    path = tmp_path / "missing.joblib"
    caplog.set_level(logging.ERROR, logger="prediction_service.api")

    with pytest.raises(RuntimeError, match="could not start without model") as caught:
        with TestClient(create_app(artifact_path=path)):
            pass

    record = next(
        record for record in caplog.records if "model_load_failed" in record.message
    )
    assert "error=model artifact does not exist" in record.message
    assert record.exc_info is None
    assert isinstance(caught.value.__cause__, ArtifactError)
