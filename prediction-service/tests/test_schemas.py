from dataclasses import fields

import pytest
from pydantic import ValidationError

from prediction_service.constants import (
    FEATURE_NAMES,
    MAX_PREDICTION_INSTANCES,
)
from prediction_service.models import HousingFeatures
from prediction_service.property_metadata import PROPERTY_METADATA
from prediction_service.schemas import (
    PredictionRequest,
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
    ],
    ids=[
        "missing-instances",
        "empty-instances",
        "too-many-instances",
        "non-list-instances",
        "unknown-instance-field",
        "string-feature",
        "boolean-feature",
    ],
)
def test_invalid_requests_are_rejected(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PredictionRequest.model_validate(payload)


def test_configured_feature_bounds_are_enforced() -> None:
    PredictionRequest.model_validate({"instances": [VALID_INSTANCE]})
    tested_bound = False

    for field_name in FEATURE_NAMES:
        metadata = getattr(PROPERTY_METADATA, field_name)
        if metadata.min is not None:
            tested_bound = True
            invalid = {
                **VALID_INSTANCE,
                field_name: metadata.min - 1,
            }
            with pytest.raises(ValidationError):
                PredictionRequest.model_validate({"instances": [invalid]})
        if metadata.max is not None:
            tested_bound = True
            invalid = {
                **VALID_INSTANCE,
                field_name: metadata.max + 1,
            }
            with pytest.raises(ValidationError):
                PredictionRequest.model_validate({"instances": [invalid]})

    if not tested_bound:
        pytest.skip("no feature bounds are configured")


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
