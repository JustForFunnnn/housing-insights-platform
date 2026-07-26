from __future__ import annotations

import math
from pathlib import Path

import pytest
from sklearn.compose import TransformedTargetRegressor
from sklearn.linear_model import LinearRegression

from prediction_service.artifact import load_artifact
from prediction_service.constants import ALGORITHM_NAME, FEATURE_NAMES
from prediction_service.errors import TrainingError
from prediction_service.prediction import SklearnPredictionService
from prediction_service.training import load_training_data, main, train


def test_training_writes_loadable_model(write_dataset, tmp_path: Path) -> None:
    output = tmp_path / "nested" / "model.joblib"

    artifact = train(write_dataset(), output)
    info = SklearnPredictionService(load_artifact(output)).model_info()

    assert output.is_file()
    assert isinstance(artifact["model"], TransformedTargetRegressor)
    assert isinstance(artifact["model"].regressor_, LinearRegression)
    assert artifact["algorithm"] == ALGORITHM_NAME
    assert artifact["features"] == list(FEATURE_NAMES)
    assert set(info.coefficients) == set(FEATURE_NAMES)
    assert info.cross_validation.folds == 5
    assert info.cross_validation.shuffle is True
    assert info.cross_validation.random_state == 42
    for metric in (
        info.cross_validation.metrics.r2,
        info.cross_validation.metrics.rmse,
        info.cross_validation.metrics.mae,
    ):
        assert math.isfinite(metric.mean)
        assert math.isfinite(metric.std)
        assert metric.std >= 0


def test_metadata_and_unrelated_columns_are_ignored(
    write_dataset,
    valid_rows,
    tmp_path: Path,
) -> None:
    rows = [{**row, "unrelated": "ignored"} for row in valid_rows]
    dataset = write_dataset(
        rows=rows,
        fieldnames=["id", *FEATURE_NAMES, "price", "unrelated"],
    )

    artifact = train(dataset, tmp_path / "model.joblib")

    assert artifact["features"] == list(FEATURE_NAMES)


def test_too_few_rows_are_rejected(write_dataset, valid_rows, tmp_path: Path) -> None:
    dataset = write_dataset(rows=valid_rows[:9])

    with pytest.raises(TrainingError, match="at least 10"):
        train(dataset, tmp_path / "model.joblib")


def test_missing_column_is_rejected(write_dataset, tmp_path: Path) -> None:
    columns = [name for name in [*FEATURE_NAMES, "price"] if name != "school_rating"]

    with pytest.raises(TrainingError, match="school_rating"):
        train(write_dataset(fieldnames=columns), tmp_path / "model.joblib")


def test_extra_cells_are_rejected(tmp_path: Path) -> None:
    dataset = tmp_path / "malformed.csv"
    dataset.write_text(
        "id,square_footage,bedrooms,bathrooms,year_built,lot_size,"
        "distance_to_city_center,school_rating,price\n"
        "1,1200,2,1,1990,5000,2.5,7,180000,unexpected\n",
        encoding="utf-8",
    )

    with pytest.raises(TrainingError, match="more values than columns"):
        load_training_data(dataset)


@pytest.mark.parametrize(
    ("column", "value"),
    [
        ("square_footage", ""),
        ("square_footage", "not-a-number"),
        ("square_footage", "nan"),
        ("square_footage", -1),
        ("bedrooms", 2.5),
        ("school_rating", 11),
        ("price", 0),
    ],
)
def test_invalid_cell_reports_row_and_column(
    write_dataset,
    valid_rows,
    tmp_path: Path,
    column: str,
    value: object,
) -> None:
    rows = [dict(row) for row in valid_rows]
    rows[0][column] = value

    with pytest.raises(TrainingError, match=rf"CSV row 2 column '{column}'"):
        train(write_dataset(rows=rows), tmp_path / "model.joblib")


def test_invalid_data_preserves_existing_artifact(
    write_dataset,
    valid_rows,
    tmp_path: Path,
) -> None:
    rows = [dict(row) for row in valid_rows]
    rows[0]["price"] = 0
    output = tmp_path / "model.joblib"
    output.write_bytes(b"existing-artifact")

    with pytest.raises(TrainingError):
        train(write_dataset(rows=rows), output)

    assert output.read_bytes() == b"existing-artifact"


def test_cli_trains_to_explicit_output(write_dataset, tmp_path: Path) -> None:
    output = tmp_path / "cli" / "model.joblib"

    exit_code = main([str(write_dataset()), "--output", str(output)])

    assert exit_code == 0
    assert output.is_file()


def test_cli_returns_one_when_training_fails(tmp_path: Path) -> None:
    output = tmp_path / "model.joblib"

    exit_code = main([str(tmp_path / "missing.csv"), "--output", str(output)])

    assert exit_code == 1
    assert not output.exists()


def test_unreadable_csv_is_rejected(tmp_path: Path) -> None:
    dataset = tmp_path / "invalid.csv"
    dataset.write_bytes(b"\xff\xfeinvalid")

    with pytest.raises(TrainingError, match="could not read dataset"):
        load_training_data(dataset)
