import math

import pytest

from prediction_service.models import FEATURE_NAMES, HousingFeatures
from prediction_service.prediction import PredictionError, SklearnPredictionService


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


def test_batch_prediction_uses_one_call_and_preserves_order(
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    artifact = artifact_factory()
    observed_rows: list[list[list[float]]] = []

    def controlled_predict(rows: list[list[float]]) -> list[float]:
        observed_rows.append(rows)
        return [row[0] * 10 + row[1] for row in rows]

    monkeypatch.setattr(artifact["model"], "predict", controlled_predict)
    service = SklearnPredictionService(artifact)

    predictions = service.predict(
        [features(2000, 4), features(900, 2), features(1500, 3)]
    )

    assert len(observed_rows) == 1
    assert predictions == [20004.0, 9002.0, 15003.0]


@pytest.mark.parametrize(
    ("output", "message"),
    [
        ([math.inf], "non-finite"),
        (["not-a-number"], "prediction failed"),
        ([1.0, 2.0], "wrong number"),
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
    assert info.algorithm == "LinearRegression"
    assert info.features == FEATURE_NAMES
    assert set(info.coefficients) == set(FEATURE_NAMES)
    assert math.isfinite(info.intercept)
    assert info.cross_validation.folds == 5
    assert info.cross_validation.metrics.rmse.mean == 12_000
    assert info.cross_validation.metrics.rmse.std == 1_000
