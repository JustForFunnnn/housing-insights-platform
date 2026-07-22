from __future__ import annotations

import argparse
import csv
import logging
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path
from statistics import fmean, pstdev

import numpy as np
from pydantic import ValidationError
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, cross_validate

from prediction_service.artifact import (
    DEFAULT_ARTIFACT_PATH,
    ArtifactError,
    CrossValidationData,
    ModelArtifact,
    save_artifact,
)
from prediction_service.models import (
    FEATURE_NAMES,
    CrossValidationInfo,
    MetricSummary,
    RegressionMetrics,
)
from prediction_service.schemas import TrainingRow

LOGGER = logging.getLogger(__name__)
REQUIRED_COLUMNS = (*FEATURE_NAMES, "price")
MINIMUM_ROWS = 10
CV_FOLDS = 5
CV_RANDOM_STATE = 42


class TrainingError(ValueError):
    """Raised when the training data cannot produce a useful model."""


def load_training_data(dataset_path: Path) -> tuple[np.ndarray, np.ndarray]:
    try:
        stream = dataset_path.open("r", newline="", encoding="utf-8-sig")
    except OSError as exc:
        raise TrainingError(f"could not open dataset: {dataset_path}") from exc

    feature_rows: list[list[float]] = []
    prices: list[int] = []

    with stream:
        reader = csv.DictReader(stream)
        missing = [
            column
            for column in REQUIRED_COLUMNS
            if column not in (reader.fieldnames or [])
        ]
        if missing:
            raise TrainingError(
                f"dataset is missing required columns: {', '.join(missing)}"
            )

        for raw_row in reader:
            try:
                row = TrainingRow.model_validate(raw_row)
            except ValidationError as exc:
                error = exc.errors()[0]
                column = error["loc"][0]
                raise TrainingError(
                    f"CSV row {reader.line_num} column '{column}': {error['msg']}"
                ) from exc
            feature_rows.append(row.to_domain().as_row())
            prices.append(row.price)

    if len(feature_rows) < MINIMUM_ROWS:
        raise TrainingError(
            f"dataset has {len(feature_rows)} rows; at least {MINIMUM_ROWS} are required"
        )

    return np.asarray(feature_rows), np.asarray(prices)


def evaluate_model(
    features: np.ndarray,
    prices: np.ndarray,
) -> CrossValidationInfo:
    splitter = KFold(
        n_splits=CV_FOLDS,
        shuffle=True,
        random_state=CV_RANDOM_STATE,
    )
    scoring = {
        "r2": "r2",
        "rmse": "neg_root_mean_squared_error",
        "mae": "neg_mean_absolute_error",
    }
    try:
        scores = cross_validate(
            LinearRegression(),
            features,
            prices,
            cv=splitter,
            scoring=scoring,
            error_score="raise",
        )
        metrics = RegressionMetrics(
            r2=_metric_summary(scores["test_r2"]),
            rmse=_metric_summary(-scores["test_rmse"]),
            mae=_metric_summary(-scores["test_mae"]),
        )
    except Exception as exc:
        raise TrainingError(f"model evaluation failed: {exc}") from exc

    return CrossValidationInfo(
        folds=CV_FOLDS,
        shuffle=True,
        random_state=CV_RANDOM_STATE,
        metrics=metrics,
    )


def _metric_summary(values: np.ndarray) -> MetricSummary:
    numbers = [float(value) for value in values]
    return MetricSummary(mean=float(fmean(numbers)), std=float(pstdev(numbers)))


def _cross_validation_data(info: CrossValidationInfo) -> CrossValidationData:
    return {
        "folds": info.folds,
        "shuffle": info.shuffle,
        "random_state": info.random_state,
        "metrics": {
            "r2": {
                "mean": info.metrics.r2.mean,
                "std": info.metrics.r2.std,
            },
            "rmse": {
                "mean": info.metrics.rmse.mean,
                "std": info.metrics.rmse.std,
            },
            "mae": {
                "mean": info.metrics.mae.mean,
                "std": info.metrics.mae.std,
            },
        },
    }


def train(
    dataset_path: Path,
    artifact_path: Path = DEFAULT_ARTIFACT_PATH,
) -> ModelArtifact:
    features, prices = load_training_data(dataset_path)
    cross_validation = evaluate_model(features, prices)
    try:
        model = LinearRegression().fit(features, prices)
    except Exception as exc:
        raise TrainingError(f"final model fit failed: {exc}") from exc

    artifact: ModelArtifact = {
        "model": model,
        "trained_at": datetime.now(UTC).isoformat(),
        "algorithm": "LinearRegression",
        "features": list(FEATURE_NAMES),
        "cross_validation": _cross_validation_data(cross_validation),
    }
    try:
        save_artifact(artifact, artifact_path)
    except ArtifactError as exc:
        raise TrainingError(str(exc)) from exc

    LOGGER.info(
        "model_trained rows=%d r2=%.3f rmse=%.2f artifact=%s",
        len(features),
        cross_validation.metrics.r2.mean,
        cross_validation.metrics.rmse.mean,
        artifact_path,
    )
    return artifact


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train the housing price model")
    parser.add_argument("dataset", type=Path, help="path to the training CSV")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_ARTIFACT_PATH,
        help=f"artifact output path (default: {DEFAULT_ARTIFACT_PATH})",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    arguments = _parser().parse_args(argv)
    try:
        train(arguments.dataset, arguments.output)
    except TrainingError as exc:
        LOGGER.error("training_failed error=%s", exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
