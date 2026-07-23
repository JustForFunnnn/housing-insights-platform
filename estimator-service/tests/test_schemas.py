from __future__ import annotations

from datetime import datetime

import pytest
from pydantic import ValidationError

from estimator_service.constants import (
    MAX_BATHROOMS,
    MAX_BEDROOMS,
    MAX_DISTANCE_TO_CITY_CENTER,
    MAX_ESTIMATE_PROPERTIES,
    MAX_LOT_SIZE,
    MAX_SQUARE_FOOTAGE,
)
from estimator_service.schemas import EstimateRequest
from tests.conftest import VALID_PROPERTY


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"properties": []},
        {"properties": [VALID_PROPERTY] * (MAX_ESTIMATE_PROPERTIES + 1)},
        {"properties": VALID_PROPERTY},
        {"properties": [{**VALID_PROPERTY, "square_footage": "1850"}]},
        {"properties": [{**VALID_PROPERTY, "school_rating": 11}]},
        {
            "properties": [
                {**VALID_PROPERTY, "year_built": datetime.now().year + 1}
            ]
        },
        {"properties": [{**VALID_PROPERTY, "unknown": 1}]},
    ],
)
def test_estimate_request_rejects_invalid_payloads(payload: object) -> None:
    with pytest.raises(ValidationError):
        EstimateRequest.model_validate(payload)


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
def test_property_static_upper_limits_are_enforced(
    field: str,
    maximum: float,
) -> None:
    valid = {**VALID_PROPERTY, field: maximum}
    invalid = {**VALID_PROPERTY, field: maximum + 1}

    EstimateRequest.model_validate({"properties": [valid]})
    with pytest.raises(ValidationError):
        EstimateRequest.model_validate({"properties": [invalid]})


def test_estimate_request_accepts_single_and_batch_properties() -> None:
    single = EstimateRequest.model_validate({"properties": [VALID_PROPERTY]})
    batch = EstimateRequest.model_validate(
        {"properties": [VALID_PROPERTY, {**VALID_PROPERTY, "bedrooms": 4}]}
    )

    assert single.properties[0].to_features().square_footage == 1850
    assert len(batch.properties) == 2
