from dataclasses import fields
from datetime import datetime

import pytest
from pydantic import ValidationError

from prediction_service.constants import (
    FEATURE_NAMES,
    MAX_BATHROOMS,
    MAX_BEDROOMS,
    MAX_DISTANCE_TO_CITY_CENTER,
    MAX_LOT_SIZE,
    MAX_PREDICTION_INSTANCES,
    MAX_SIGNED_INT64,
    MAX_SQUARE_FOOTAGE,
)
from prediction_service.models import HousingFeatures
from prediction_service.schemas import (
    ErrorMetricSummaryResponse,
    MetricSummaryResponse,
    PredictionRequest,
    PredictionResponse,
    TrainingRow,
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


def test_request_maps_to_semantic_domain_features() -> None:
    request = PredictionRequest.model_validate({"instances": [VALID_INSTANCE]})
    features = request.instances[0].to_features()

    assert FEATURE_NAMES == tuple(field.name for field in fields(HousingFeatures))
    assert features == HousingFeatures(
        square_footage=1850,
        bedrooms=3,
        bathrooms=2,
        year_built=1998,
        lot_size=7500,
        distance_to_city_center=5.6,
        school_rating=8.2,
    )
    assert features.as_row() == [1850, 3, 2, 1998, 7500, 5.6, 8.2]


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"instances": []},
        {"instances": [VALID_INSTANCE] * (MAX_PREDICTION_INSTANCES + 1)},
        {"instances": VALID_INSTANCE},
        {"instances": [{**VALID_INSTANCE, "unknown": "value"}]},
        {"instances": [{**VALID_INSTANCE, "square_footage": "1850"}]},
        {"instances": [{**VALID_INSTANCE, "square_footage": True}]},
        {"instances": [{**VALID_INSTANCE, "school_rating": 11}]},
        {"instances": [{**VALID_INSTANCE, "year_built": datetime.now().year + 1}]},
    ],
    ids=[
        "missing-instances",
        "empty-instances",
        "too-many-instances",
        "non-list-instances",
        "unknown-instance-field",
        "string-feature",
        "boolean-feature",
        "school-rating-out-of-range",
        "future-year-built",
    ],
)
def test_invalid_requests_are_rejected(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PredictionRequest.model_validate(payload)


@pytest.mark.parametrize(
    ("field", "maximum"),
    [
        ("square_footage", MAX_SQUARE_FOOTAGE),
        ("bedrooms", MAX_BEDROOMS),
        ("bathrooms", MAX_BATHROOMS),
        ("lot_size", MAX_LOT_SIZE),
        ("distance_to_city_center", MAX_DISTANCE_TO_CITY_CENTER),
    ],
)
def test_feature_static_upper_limits_are_enforced(
    field: str,
    maximum: float,
) -> None:
    valid = {**VALID_INSTANCE, field: maximum}
    invalid = {**VALID_INSTANCE, field: maximum + 1}

    PredictionRequest.model_validate({"instances": [valid]})
    with pytest.raises(ValidationError):
        PredictionRequest.model_validate({"instances": [invalid]})


def test_training_schema_has_independent_coercion_and_extra_policy() -> None:
    row = TrainingRow.model_validate(
        {
            **{name: str(value) for name, value in VALID_INSTANCE.items()},
            "price": "265000",
            "id": "csv-metadata",
            "unrelated": "ignored",
        }
    )

    assert row.to_features().square_footage == 1850
    assert row.price == 265000

    with pytest.raises(ValidationError):
        TrainingRow.model_validate({**VALID_INSTANCE, "price": 265000.5})


def test_prediction_response_rejects_non_integer_prediction() -> None:
    with pytest.raises(ValidationError):
        PredictionResponse(predictions=[285478.9])


@pytest.mark.parametrize("prediction", [-1, MAX_SIGNED_INT64 + 1])
def test_prediction_response_rejects_out_of_range_prediction(
    prediction: int,
) -> None:
    with pytest.raises(ValidationError):
        PredictionResponse(predictions=[prediction])


def test_metric_response_rejects_non_finite_values() -> None:
    with pytest.raises(ValidationError):
        MetricSummaryResponse(mean=float("inf"), std=0)


def test_metric_response_rejects_negative_standard_deviation() -> None:
    with pytest.raises(ValidationError):
        MetricSummaryResponse(mean=1, std=-1)


def test_error_metric_response_rejects_negative_mean() -> None:
    with pytest.raises(ValidationError):
        ErrorMetricSummaryResponse(mean=-1, std=0)
