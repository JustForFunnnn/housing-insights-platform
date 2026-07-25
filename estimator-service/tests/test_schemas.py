from __future__ import annotations

import pytest
from pydantic import ValidationError

from estimator_service.constants import MAX_ESTIMATE_PROPERTIES
from estimator_service.property_metadata import PROPERTY_METADATA
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
        {"properties": [{**VALID_PROPERTY, "unknown": 1}]},
    ],
)
def test_estimate_request_rejects_invalid_payloads(payload: object) -> None:
    with pytest.raises(ValidationError):
        EstimateRequest.model_validate(payload)


def test_configured_feature_bounds_are_enforced() -> None:
    EstimateRequest.model_validate({"properties": [VALID_PROPERTY]})
    tested_bound = False

    for field_name in VALID_PROPERTY:
        metadata = getattr(PROPERTY_METADATA, field_name)
        if metadata.min is not None:
            tested_bound = True
            invalid = {
                **VALID_PROPERTY,
                field_name: metadata.min - 1,
            }
            with pytest.raises(ValidationError):
                EstimateRequest.model_validate({"properties": [invalid]})
        if metadata.max is not None:
            tested_bound = True
            invalid = {
                **VALID_PROPERTY,
                field_name: metadata.max + 1,
            }
            with pytest.raises(ValidationError):
                EstimateRequest.model_validate({"properties": [invalid]})

    if not tested_bound:
        pytest.skip("no property bounds are configured")
