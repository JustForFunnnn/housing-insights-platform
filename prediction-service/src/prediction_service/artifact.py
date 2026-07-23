from __future__ import annotations

import math
import os
import tempfile
from pathlib import Path
from typing import TypedDict

import joblib
from sklearn.linear_model import LinearRegression
from sklearn.utils.validation import check_is_fitted

from prediction_service.constants import FEATURE_NAMES


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


def _parse_model(model: object) -> LinearRegression:
    if not isinstance(model, LinearRegression):
        raise ArtifactError("artifact model must be LinearRegression")
    try:
        check_is_fitted(model, ["coef_", "intercept_"])
        coefficients = [
            _finite_number(coefficient, "model coefficient")
            for coefficient in model.coef_
        ]
        _finite_number(model.intercept_, "model intercept")
    except ArtifactError:
        raise
    except Exception as exc:
        raise ArtifactError("artifact model is not fitted") from exc
    if len(coefficients) != len(FEATURE_NAMES):
        raise ArtifactError("artifact coefficient count is incompatible")
    return model


def _parse_metric_summary(
    summary: object,
    label: str,
    non_negative_mean: bool = False,
) -> MetricSummaryData:
    if not isinstance(summary, dict):
        raise ArtifactError(f"{label} must be a mapping")
    mean = _finite_number(summary.get("mean"), f"{label}.mean")
    std = _finite_number(summary.get("std"), f"{label}.std")
    if std < 0:
        raise ArtifactError(f"{label}.std must be non-negative")
    if non_negative_mean and mean < 0:
        raise ArtifactError(f"{label}.mean must be non-negative")
    return {"mean": mean, "std": std}


def _parse_cross_validation(validation: object) -> CrossValidationData:
    if not isinstance(validation, dict):
        raise ArtifactError("cross_validation must be a mapping")

    folds = validation.get("folds")
    if isinstance(folds, bool) or not isinstance(folds, int) or folds < 2:
        raise ArtifactError("cross_validation folds must be an integer of at least 2")

    shuffle = validation.get("shuffle")
    if not isinstance(shuffle, bool):
        raise ArtifactError("cross_validation shuffle must be a boolean")

    random_state = validation.get("random_state")
    if isinstance(random_state, bool) or not isinstance(random_state, int):
        raise ArtifactError("cross_validation random_state must be an integer")

    metrics = validation.get("metrics")
    if not isinstance(metrics, dict):
        raise ArtifactError("metrics must be a mapping")

    return {
        "folds": folds,
        "shuffle": shuffle,
        "random_state": random_state,
        "metrics": {
            "r2": _parse_metric_summary(metrics.get("r2"), "r2"),
            "rmse": _parse_metric_summary(
                metrics.get("rmse"),
                "rmse",
                non_negative_mean=True,
            ),
            "mae": _parse_metric_summary(
                metrics.get("mae"),
                "mae",
                non_negative_mean=True,
            ),
        },
    }


def load_artifact(path: Path) -> ModelArtifact:
    if not path.is_file():
        raise ArtifactError(f"model artifact does not exist: {path}")
    try:
        artifact = joblib.load(path)
    except Exception as exc:
        raise ArtifactError(f"model artifact could not be loaded: {path}") from exc
    return parse_artifact(artifact)


def parse_artifact(artifact: object) -> ModelArtifact:
    if not isinstance(artifact, dict):
        raise ArtifactError("artifact must be a mapping")

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

    trained_at = artifact["trained_at"]
    if not isinstance(trained_at, str):
        raise ArtifactError("artifact trained_at must be a string")

    return {
        "model": _parse_model(artifact["model"]),
        "trained_at": trained_at,
        "algorithm": "LinearRegression",
        "features": list(FEATURE_NAMES),
        "cross_validation": _parse_cross_validation(artifact["cross_validation"]),
    }


def save_artifact(artifact: ModelArtifact, path: Path) -> None:
    parsed_artifact = parse_artifact(artifact)
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
        joblib.dump(parsed_artifact, temporary_path)
        os.replace(temporary_path, path)
        temporary_path = None
    except Exception as exc:
        raise ArtifactError(f"model artifact could not be written: {path}") from exc
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
