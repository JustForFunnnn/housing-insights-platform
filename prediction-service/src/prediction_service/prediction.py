from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Protocol

from prediction_service.artifact import MetricSummaryData, ModelArtifact
from prediction_service.constants import (
    FEATURE_NAMES,
    MAX_SIGNED_INT64,
    MINIMUM_PRICE,
    TARGET_TRANSFORM,
)
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
        if not all(value > 0 for value in predictions):
            raise PredictionError(
                "model returned a prediction outside the supported price range"
            )

        rounded_predictions = [
            max(MINIMUM_PRICE, round(value))
            for value in predictions
        ]
        if not all(
            value <= MAX_SIGNED_INT64
            for value in rounded_predictions
        ):
            raise PredictionError(
                "model returned a prediction outside the supported price range"
            )
        return rounded_predictions

    def model_info(self) -> ModelInfo:
        cross_validation = self._artifact["cross_validation"]
        metrics = cross_validation["metrics"]
        regressor = self._model.regressor_

        return ModelInfo(
            training_timestamp=self._artifact["trained_at"],
            algorithm=self._artifact["algorithm"],
            target_transform=TARGET_TRANSFORM,
            features=FEATURE_NAMES,
            intercept=float(regressor.intercept_),
            coefficients={
                feature: float(value)
                for feature, value in zip(
                    FEATURE_NAMES,
                    regressor.coef_,
                    strict=True,
                )
            },
            cross_validation=CrossValidationInfo(
                folds=cross_validation["folds"],
                shuffle=cross_validation["shuffle"],
                random_state=cross_validation["random_state"],
                metrics=RegressionMetrics(
                    r2=_metric_summary_from_data(metrics["r2"]),
                    rmse=_metric_summary_from_data(metrics["rmse"]),
                    mae=_metric_summary_from_data(metrics["mae"]),
                ),
            ),
        )


def _metric_summary_from_data(data: MetricSummaryData) -> MetricSummary:
    return MetricSummary(mean=data["mean"], std=data["std"])
