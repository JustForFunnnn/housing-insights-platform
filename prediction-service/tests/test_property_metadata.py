import json
from pathlib import Path

import pytest

from prediction_service.constants import FEATURE_NAMES
from prediction_service.errors import PropertyMetadataError
from prediction_service.property_metadata import PropertyMetadata

CONTRACT_PATH = (
    Path(__file__).parents[2]
    / "contracts"
    / "property-metadata.json"
)


def test_loads_exact_shared_contract_as_immutable_startup_snapshot(
    tmp_path: Path,
) -> None:
    configured = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    configured["price_currency"] = "fixture_currency"
    path = tmp_path / "property-metadata.json"
    path.write_text(json.dumps(configured), encoding="utf-8")

    metadata = PropertyMetadata.load(path)
    path.write_text("{}", encoding="utf-8")

    assert tuple(type(metadata.features).model_fields) == FEATURE_NAMES
    assert metadata.features.lot_size.unit == "sq_ft"


def test_rejects_missing_or_invalid_metadata(
    tmp_path: Path,
) -> None:
    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(tmp_path / "missing.json")

    invalid = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    invalid["features"]["bathrooms"]["min"] = 2
    invalid["features"]["bathrooms"]["max"] = 1
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(invalid), encoding="utf-8")
    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(path)
