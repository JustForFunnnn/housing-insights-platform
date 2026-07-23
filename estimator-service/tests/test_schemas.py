from __future__ import annotations

from datetime import datetime

import pytest
from pydantic import ValidationError

from estimator_service.constants import MAX_ESTIMATE_PROPERTIES
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


def test_estimate_request_accepts_single_and_batch_properties() -> None:
    single = EstimateRequest.model_validate({"properties": [VALID_PROPERTY]})
    batch = EstimateRequest.model_validate(
        {"properties": [VALID_PROPERTY, {**VALID_PROPERTY, "bedrooms": 4}]}
    )

    assert single.properties[0].to_features().square_footage == 1850
    assert len(batch.properties) == 2
