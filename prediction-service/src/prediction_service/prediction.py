from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Protocol

from prediction_service.artifact import MetricSummaryData, ModelArtifact
from prediction_service.constants import FEATURE_NAMES
from prediction_service.errors import PredictionError
from prediction_service.models import (
    CrossValidationInfo,
    HousingFeatures,
    MetricSummary,
    ModelInfo,
    RegressionMetrics,
)


class PredictionService(Protocol):
    def predict(self, instances: Sequence[HousingFeatures]) -> list[int]: ...

    def model_info(self) -> ModelInfo: ...


class SklearnPredictionService:
    """Scikit-learn adapter that is independent of HTTP schemas."""

    def __init__(self, artifact: ModelArtifact) -> None:
        self._artifact = artifact
        self._model = artifact["model"]

    def predict(self, instances: Sequence[HousingFeatures]) -> list[int]:
        if not instances:
            raise PredictionError("prediction batch must not be empty")

        rows = [instance.as_row() for instance in instances]
        try:
            raw_predictions = self._model.predict(rows)
            predictions = [float(value) for value in raw_predictions]
        except Exception as exc:
            raise PredictionError("model prediction failed") from exc

        if len(predictions) != len(instances):
            raise PredictionError("model returned the wrong number of predictions")
        if not all(math.isfinite(value) for value in predictions):
            raise PredictionError("model returned a non-finite prediction")
        return [round(value) for value in predictions]

    def model_info(self) -> ModelInfo:
        cross_validation = self._artifact["cross_validation"]
        metrics = cross_validation["metrics"]

        return ModelInfo(
            training_timestamp=self._artifact["trained_at"],
            algorithm=self._artifact["algorithm"],
            features=FEATURE_NAMES,
            intercept=float(self._model.intercept_),
            coefficients={
                feature: float(value)
                for feature, value in zip(
                    FEATURE_NAMES,
                    self._model.coef_,
                    strict=True,
                )
            },
            cross_validation=CrossValidationInfo(
                folds=cross_validation["folds"],
                shuffle=cross_validation["shuffle"],
                random_state=cross_validation["random_state"],
                metrics=RegressionMetrics(
                    r2=_metric_summary(metrics["r2"]),
                    rmse=_metric_summary(metrics["rmse"]),
                    mae=_metric_summary(metrics["mae"]),
                ),
            ),
        )


def _metric_summary(data: MetricSummaryData) -> MetricSummary:
    return MetricSummary(mean=data["mean"], std=data["std"])
