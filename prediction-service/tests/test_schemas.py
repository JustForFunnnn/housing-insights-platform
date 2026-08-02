from dataclasses import fields

import pytest
from pydantic import ValidationError

from prediction_service import domain
from prediction_service.constants import (
    FEATURE_NAMES,
    MAX_PREDICTION_PROPERTIES,
)
from prediction_service.property_metadata import PROPERTY_METADATA
from prediction_service.schemas import (
    PredictionRequest,
    TrainingRow,
)

VALID_PROPERTY = {
    "square_footage": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1998,
    "lot_size": 7500,
    "distance_to_city_center": 5.6,
    "school_rating": 8.2,
}


def test_request_maps_to_semantic_domain_features() -> None:
    request = PredictionRequest.model_validate({"properties": [VALID_PROPERTY]})
    features = request.properties[0].to_features()

    assert FEATURE_NAMES == tuple(field.name for field in fields(domain.PropertyFeatures))
    assert features == domain.PropertyFeatures(
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
        {"properties": []},
        {"properties": [VALID_PROPERTY] * (MAX_PREDICTION_PROPERTIES + 1)},
        {"properties": VALID_PROPERTY},
        {"properties": [{**VALID_PROPERTY, "unknown": "value"}]},
        {"properties": [{**VALID_PROPERTY, "square_footage": "1850"}]},
        {"properties": [{**VALID_PROPERTY, "square_footage": True}]},
    ],
    ids=[
        "missing-properties",
        "empty-properties",
        "too-many-properties",
        "non-list-properties",
        "unknown-property-field",
        "string-feature",
        "boolean-feature",
    ],
)
def test_invalid_requests_are_rejected(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PredictionRequest.model_validate(payload)


def test_configured_feature_bounds_are_enforced() -> None:
    PredictionRequest.model_validate({"properties": [VALID_PROPERTY]})
    tested_bound = False

    for field_name in FEATURE_NAMES:
        metadata = getattr(PROPERTY_METADATA.features, field_name)
        if metadata.min is not None:
            tested_bound = True
            invalid = {
                **VALID_PROPERTY,
                field_name: metadata.min - 1,
            }
            with pytest.raises(ValidationError):
                PredictionRequest.model_validate({"properties": [invalid]})
        if metadata.max is not None:
            tested_bound = True
            invalid = {
                **VALID_PROPERTY,
                field_name: metadata.max + 1,
            }
            with pytest.raises(ValidationError):
                PredictionRequest.model_validate({"properties": [invalid]})

    if not tested_bound:
        pytest.skip("no feature bounds are configured")


def test_training_schema_has_independent_coercion_and_extra_policy() -> None:
    row = TrainingRow.model_validate(
        {
            **{name: str(value) for name, value in VALID_PROPERTY.items()},
            "price": "265000",
            "id": "csv-metadata",
            "unrelated": "ignored",
        }
    )

    assert row.to_features().square_footage == 1850
    assert row.price == 265000

    with pytest.raises(ValidationError):
        TrainingRow.model_validate({**VALID_PROPERTY, "price": 265000.5})
