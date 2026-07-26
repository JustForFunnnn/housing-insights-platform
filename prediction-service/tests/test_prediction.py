import math

import pytest

from prediction_service.constants import (
    ALGORITHM_NAME,
    FEATURE_NAMES,
    TARGET_TRANSFORM,
)
from prediction_service.errors import PredictionError
from prediction_service.models import HousingFeatures
from prediction_service.prediction import SklearnPredictionService


def features(square_footage: float, bedrooms: int) -> HousingFeatures:
    return HousingFeatures(
        square_footage=square_footage,
        bedrooms=bedrooms,
        bathrooms=2,
        year_built=2000,
        lot_size=7000,
        distance_to_city_center=5,
        school_rating=8,
    )


def test_batch_prediction_preserves_count_and_order(
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    artifact = artifact_factory()

    def controlled_predict(rows: list[list[float]]) -> list[float]:
        return [row[0] * 10 + row[1] for row in rows]

    monkeypatch.setattr(artifact["model"], "predict", controlled_predict)
    service = SklearnPredictionService(artifact)

    predictions = service.predict([features(2000, 4), features(900, 2), features(1500, 3)])

    assert len(predictions) == 3
    assert predictions == [20004, 9002, 15003]


def test_empty_prediction_batch_is_rejected(artifact_factory) -> None:
    with pytest.raises(PredictionError, match="must not be empty"):
        SklearnPredictionService(artifact_factory()).predict([])


def test_predictions_are_rounded_to_positive_integers(
    artifact_factory,
    monkeypatch,
) -> None:
    artifact = artifact_factory()
    monkeypatch.setattr(
        artifact["model"],
        "predict",
        lambda rows: [0.1, 1000.4, 2000.6],
    )

    predictions = SklearnPredictionService(artifact).predict([features(500, 1), features(1000, 2), features(2000, 3)])

    assert predictions == [1, 1000, 2001]
    assert all(isinstance(value, int) for value in predictions)


@pytest.mark.parametrize(
    ("output", "message"),
    [
        ([math.inf], "non-finite"),
        (["not-a-number"], "prediction failed"),
        ([1.0, 2.0], "wrong number"),
        ([0.0], "outside the supported price range"),
        ([float(2**63)], "outside the supported price range"),
    ],
)
def test_invalid_prediction_output_is_rejected(
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
    output: list[object],
    message: str,
) -> None:
    artifact = artifact_factory()
    monkeypatch.setattr(artifact["model"], "predict", lambda rows: output)

    with pytest.raises(PredictionError, match=message):
        SklearnPredictionService(artifact).predict([features(1000, 2)])


def test_model_information_uses_artifact_metadata(artifact_factory) -> None:
    artifact = artifact_factory()

    info = SklearnPredictionService(artifact).model_info()

    assert info.training_timestamp == artifact["trained_at"]
    assert info.algorithm == ALGORITHM_NAME
    assert info.target_transform == TARGET_TRANSFORM
    assert info.features == FEATURE_NAMES
    assert set(info.coefficients) == set(FEATURE_NAMES)
    assert math.isfinite(info.intercept)
    assert info.cross_validation.folds == 5
    assert info.cross_validation.metrics.rmse.mean == 12000
    assert info.cross_validation.metrics.rmse.std == 1000
