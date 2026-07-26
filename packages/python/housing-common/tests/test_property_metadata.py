import json
from pathlib import Path

import pytest

from housing_common.property_metadata import (
    PropertyMetadata,
    PropertyMetadataError,
)

CONTRACT_PATH = Path(__file__).parents[4] / "contracts" / "property-metadata.json"
FEATURE_NAMES = (
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
)


def test_loads_shared_contract_as_immutable_startup_snapshot(
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
    assert metadata.price_currency == "fixture_currency"


def test_rejects_missing_currency(tmp_path: Path) -> None:
    configured = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    configured.pop("price_currency")
    path = tmp_path / "property-metadata.json"
    path.write_text(json.dumps(configured), encoding="utf-8")

    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(path)


def test_rejects_missing_metadata(tmp_path: Path) -> None:
    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(tmp_path / "missing.json")


def test_rejects_inverted_bounds(tmp_path: Path) -> None:
    invalid = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    invalid["features"]["bathrooms"]["min"] = 2
    invalid["features"]["bathrooms"]["max"] = 1
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(invalid), encoding="utf-8")

    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(path)


def test_rejects_non_finite_bounds(tmp_path: Path) -> None:
    invalid = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    invalid["features"]["school_rating"]["max"] = float("inf")
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(invalid), encoding="utf-8")

    with pytest.raises(PropertyMetadataError):
        PropertyMetadata.load(path)
