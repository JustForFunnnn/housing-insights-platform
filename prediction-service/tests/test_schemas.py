from dataclasses import fields
from datetime import datetime

import pytest
from pydantic import ValidationError

from prediction_service.models import FEATURE_NAMES, HousingFeatures
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
    features = request.instances[0].to_domain()

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
        {"instances": [VALID_INSTANCE] * 101},
        {"instances": VALID_INSTANCE},
        {"instances": [{**VALID_INSTANCE, "square_footage": "1850"}]},
        {"instances": [{**VALID_INSTANCE, "square_footage": True}]},
        {"instances": [{**VALID_INSTANCE, "school_rating": 11}]},
        {"instances": [{**VALID_INSTANCE, "year_built": datetime.now().year + 1}]},
    ],
)
def test_invalid_requests_are_rejected(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PredictionRequest.model_validate(payload)


def test_training_schema_has_independent_coercion_and_extra_policy() -> None:
    row = TrainingRow.model_validate(
        {
            **{name: str(value) for name, value in VALID_INSTANCE.items()},
            "price": "265000",
            "id": "csv-metadata",
            "unrelated": "ignored",
        }
    )

    assert row.to_domain().square_footage == 1850
    assert row.price == 265000


def test_response_constraints_are_explicit() -> None:
    with pytest.raises(ValidationError):
        PredictionResponse(predictions=[], count=-1)
    with pytest.raises(ValidationError):
        PredictionResponse(predictions=[float("inf")], count=1)
    with pytest.raises(ValidationError):
        MetricSummaryResponse(mean=1, std=-1)
    with pytest.raises(ValidationError):
        ErrorMetricSummaryResponse(mean=-1, std=0)
