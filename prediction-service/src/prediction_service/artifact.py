from __future__ import annotations

import math
import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import TypedDict, cast

import joblib
from sklearn.linear_model import LinearRegression
from sklearn.utils.validation import check_is_fitted

from prediction_service.models import FEATURE_NAMES

DEFAULT_ARTIFACT_PATH = Path("artifacts/model_pipeline.joblib")


class MetricSummaryData(TypedDict):
    mean: float
    std: float


class RegressionMetricsData(TypedDict):
    r2: MetricSummaryData
    rmse: MetricSummaryData
    mae: MetricSummaryData


class CrossValidationData(TypedDict):
    folds: int
    shuffle: bool
    random_state: int
    metrics: RegressionMetricsData


class ModelArtifact(TypedDict):
    model: LinearRegression
    trained_at: str
    algorithm: str
    features: list[str]
    cross_validation: CrossValidationData


class ArtifactError(RuntimeError):
    """Raised when a model artifact cannot be read, validated, or written."""


def _mapping(value: object, label: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise ArtifactError(f"{label} must be a mapping")
    return cast(dict[str, object], value)


def _finite_number(value: object, label: str) -> float:
    if isinstance(value, bool):
        raise ArtifactError(f"{label} must be a finite number")
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ArtifactError(f"{label} must be a finite number") from exc
    if not math.isfinite(number):
        raise ArtifactError(f"{label} must be a finite number")
    return number


def load_artifact(path: Path) -> ModelArtifact:
    if not path.is_file():
        raise ArtifactError(f"model artifact does not exist: {path}")
    try:
        artifact = joblib.load(path)
    except Exception as exc:
        raise ArtifactError(f"model artifact could not be loaded: {path}") from exc
    return validate_artifact(artifact)


def validate_artifact(value: object) -> ModelArtifact:
    artifact = _mapping(value, "artifact")
    required = {
        "model",
        "trained_at",
        "algorithm",
        "features",
        "cross_validation",
    }
    missing = sorted(required.difference(artifact))
    if missing:
        raise ArtifactError(
            f"artifact is missing required fields: {', '.join(missing)}"
        )

    if artifact["algorithm"] != "LinearRegression":
        raise ArtifactError("artifact algorithm must be LinearRegression")
    if artifact["features"] != list(FEATURE_NAMES):
        raise ArtifactError("artifact uses an incompatible feature order")

    timestamp = artifact["trained_at"]
    if not isinstance(timestamp, str):
        raise ArtifactError("artifact trained_at must be an ISO 8601 UTC string")
    try:
        parsed_timestamp = datetime.fromisoformat(timestamp)
    except ValueError as exc:
        raise ArtifactError(
            "artifact trained_at must be an ISO 8601 UTC string"
        ) from exc
    if parsed_timestamp.tzinfo is None or parsed_timestamp.utcoffset() != timedelta(0):
        raise ArtifactError("artifact trained_at must use UTC")

    model = artifact["model"]
    if not isinstance(model, LinearRegression):
        raise ArtifactError("artifact model must be LinearRegression")
    try:
        check_is_fitted(model, ["coef_", "intercept_"])
        coefficients = [
            _finite_number(value, "model coefficient") for value in model.coef_
        ]
        _finite_number(model.intercept_, "model intercept")
    except ArtifactError:
        raise
    except Exception as exc:
        raise ArtifactError("artifact model is not fitted") from exc
    if len(coefficients) != len(FEATURE_NAMES):
        raise ArtifactError("artifact coefficient count is incompatible")

    cross_validation = _mapping(artifact["cross_validation"], "cross_validation")
    if cross_validation.get("folds") != 5:
        raise ArtifactError("cross_validation folds must equal 5")
    if cross_validation.get("shuffle") is not True:
        raise ArtifactError("cross_validation shuffle must be true")
    if cross_validation.get("random_state") != 42:
        raise ArtifactError("cross_validation random_state must equal 42")

    metrics = _mapping(cross_validation.get("metrics"), "metrics")
    for metric_name in ("r2", "rmse", "mae"):
        summary = _mapping(metrics.get(metric_name), metric_name)
        mean = _finite_number(summary.get("mean"), f"{metric_name}.mean")
        std = _finite_number(summary.get("std"), f"{metric_name}.std")
        if std < 0:
            raise ArtifactError(f"{metric_name}.std must be non-negative")
        if metric_name in {"rmse", "mae"} and mean < 0:
            raise ArtifactError(f"{metric_name}.mean must be non-negative")

    return cast(ModelArtifact, artifact)


def save_artifact(artifact: ModelArtifact, path: Path) -> None:
    validated = validate_artifact(artifact)
    temporary_path: Path | None = None

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
        joblib.dump(validated, temporary_path)
        os.replace(temporary_path, path)
        temporary_path = None
    except Exception as exc:
        raise ArtifactError(f"model artifact could not be written: {path}") from exc
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
