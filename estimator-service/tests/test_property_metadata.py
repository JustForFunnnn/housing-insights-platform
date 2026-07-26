import json
from pathlib import Path

import pytest

from estimator_service.errors import PropertyMetadataError
from estimator_service.property_metadata import PropertyMetadata

CONTRACT_PATH = (
    Path(__file__).parents[2]
    / "contracts"
    / "property-metadata.json"
)


def test_loads_exact_contract_once_as_immutable_snapshot(tmp_path: Path) -> None:
    configured = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    configured["price_currency"] = "fixture_currency"
    path = tmp_path / "property-metadata.json"
    path.write_text(json.dumps(configured), encoding="utf-8")

    metadata = PropertyMetadata.load(path)
    path.write_text("{}", encoding="utf-8")

    assert set(type(metadata.features).model_fields) == {
        "square_footage",
        "bedrooms",
        "bathrooms",
        "year_built",
        "lot_size",
        "distance_to_city_center",
        "school_rating",
    }
    assert metadata.price_currency == configured["price_currency"]


def test_rejects_missing_or_invalid_metadata(tmp_path: Path) -> None:
    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(tmp_path / "missing.json")

    invalid = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    invalid["features"]["school_rating"]["max"] = float("inf")
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(invalid), encoding="utf-8")
    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(path)
