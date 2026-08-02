from __future__ import annotations

import math
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
from sklearn.compose import TransformedTargetRegressor
from sklearn.linear_model import LinearRegression
from sklearn.utils.validation import check_is_fitted

from prediction_service import domain
from prediction_service.constants import ALGORITHM_NAME, FEATURE_NAMES
from prediction_service.errors import ArtifactError


@dataclass(frozen=True, slots=True)
class ModelArtifact:
    model: TransformedTargetRegressor
    trained_at: str
    algorithm: str
    features: tuple[str, ...]
    cross_validation: domain.CrossValidationResult


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


def _parse_model(model: object) -> TransformedTargetRegressor:
    if not isinstance(model, TransformedTargetRegressor):
        raise ArtifactError("artifact model must be TransformedTargetRegressor")
    if model.func is not np.log or model.inverse_func is not np.exp:
        raise ArtifactError("artifact model must use log and exp target transforms")
    try:
        check_is_fitted(model, ["regressor_", "transformer_"])
        regressor = model.regressor_
        if not isinstance(regressor, LinearRegression):
            raise ArtifactError("artifact regressor must be LinearRegression")
        check_is_fitted(regressor, ["coef_", "intercept_"])
        coefficients = [_finite_number(coefficient, "model coefficient") for coefficient in regressor.coef_]
        _finite_number(regressor.intercept_, "model intercept")
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
) -> domain.MetricSummary:
    if not isinstance(summary, dict):
        raise ArtifactError(f"{label} must be a mapping")
    mean = _finite_number(summary.get("mean"), f"{label}.mean")
    std = _finite_number(summary.get("std"), f"{label}.std")
    if std < 0:
        raise ArtifactError(f"{label}.std must be non-negative")
    if non_negative_mean and mean < 0:
        raise ArtifactError(f"{label}.mean must be non-negative")
    return domain.MetricSummary(mean=mean, std=std)


def _parse_cross_validation(validation: object) -> domain.CrossValidationResult:
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

    return domain.CrossValidationResult(
        folds=folds,
        shuffle=shuffle,
        random_state=random_state,
        metrics=domain.RegressionMetrics(
            r2=_parse_metric_summary(metrics.get("r2"), "r2"),
            rmse=_parse_metric_summary(
                metrics.get("rmse"),
                "rmse",
                non_negative_mean=True,
            ),
            mae=_parse_metric_summary(
                metrics.get("mae"),
                "mae",
                non_negative_mean=True,
            ),
        ),
    )


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
        raise ArtifactError(f"artifact is missing required fields: {', '.join(missing)}")

    if artifact["algorithm"] != ALGORITHM_NAME:
        raise ArtifactError(f"artifact algorithm must be {ALGORITHM_NAME}")

    if artifact["features"] != list(FEATURE_NAMES):
        raise ArtifactError("artifact uses an incompatible feature order")

    trained_at = artifact["trained_at"]
    if not isinstance(trained_at, str):
        raise ArtifactError("artifact trained_at must be a string")

    return ModelArtifact(
        model=_parse_model(artifact["model"]),
        trained_at=trained_at,
        algorithm=ALGORITHM_NAME,
        features=FEATURE_NAMES,
        cross_validation=_parse_cross_validation(artifact["cross_validation"]),
    )


def _artifact_payload(artifact: ModelArtifact) -> dict[str, object]:
    validation = artifact.cross_validation
    metrics = validation.metrics
    return {
        "model": artifact.model,
        "trained_at": artifact.trained_at,
        "algorithm": artifact.algorithm,
        "features": list(artifact.features),
        "cross_validation": {
            "folds": validation.folds,
            "shuffle": validation.shuffle,
            "random_state": validation.random_state,
            "metrics": {
                "r2": {"mean": metrics.r2.mean, "std": metrics.r2.std},
                "rmse": {"mean": metrics.rmse.mean, "std": metrics.rmse.std},
                "mae": {"mean": metrics.mae.mean, "std": metrics.mae.std},
            },
        },
    }


def save_artifact(artifact: ModelArtifact, path: Path) -> None:
    parsed_artifact = parse_artifact(_artifact_payload(artifact))
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
        joblib.dump(_artifact_payload(parsed_artifact), temporary_path)
        os.replace(temporary_path, path)
        temporary_path = None
    except Exception as exc:
        raise ArtifactError(f"model artifact could not be written: {path}") from exc
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
