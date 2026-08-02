from dataclasses import asdict
from pathlib import Path

import pytest
from sklearn.linear_model import LinearRegression

from prediction_service.artifact import (
    load_artifact,
    parse_artifact,
    save_artifact,
)
from prediction_service.constants import FEATURE_NAMES
from prediction_service.errors import ArtifactError


def raw_artifact(artifact) -> dict[str, object]:
    return {
        "model": artifact.model,
        "trained_at": artifact.trained_at,
        "algorithm": artifact.algorithm,
        "features": list(artifact.features),
        "cross_validation": asdict(artifact.cross_validation),
    }


def test_valid_artifact_round_trips(tmp_path: Path, artifact_factory) -> None:
    path = tmp_path / "nested" / "model.joblib"

    save_artifact(artifact_factory(), path)
    loaded = load_artifact(path)

    assert path.is_file()
    assert loaded.features == FEATURE_NAMES


@pytest.mark.parametrize(
    "mutation",
    [
        lambda artifact: artifact.update(features=list(reversed(FEATURE_NAMES))),
        lambda artifact: artifact.update(trained_at=123),
        lambda artifact: artifact.pop("cross_validation"),
        lambda artifact: artifact["cross_validation"]["metrics"]["rmse"].update(mean=float("nan")),
    ],
    ids=[
        "incompatible-feature-order",
        "invalid-trained-at-type",
        "missing-cross-validation",
        "non-finite-rmse",
    ],
)
def test_incompatible_artifact_is_rejected(artifact_factory, mutation) -> None:
    artifact = raw_artifact(artifact_factory())
    mutation(artifact)

    with pytest.raises(ArtifactError):
        parse_artifact(artifact)


def test_unwrapped_linear_regression_artifact_is_rejected(
    artifact_factory,
) -> None:
    artifact = raw_artifact(artifact_factory())
    artifact["model"] = LinearRegression()

    with pytest.raises(
        ArtifactError,
        match="must be TransformedTargetRegressor",
    ):
        parse_artifact(artifact)


def test_missing_and_corrupt_artifacts_are_rejected(tmp_path: Path) -> None:
    with pytest.raises(ArtifactError, match="does not exist"):
        load_artifact(tmp_path / "missing.joblib")

    corrupt = tmp_path / "corrupt.joblib"
    corrupt.write_bytes(b"not a joblib artifact")
    with pytest.raises(ArtifactError, match="could not be loaded"):
        load_artifact(corrupt)


def test_failed_write_preserves_existing_artifact(
    tmp_path: Path,
    artifact_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    target = tmp_path / "model.joblib"
    target.write_bytes(b"existing-model")

    def fail_dump(value: object, path: Path) -> None:
        path.write_bytes(b"partial-model")
        raise OSError("simulated serialization failure")

    monkeypatch.setattr("prediction_service.artifact.joblib.dump", fail_dump)

    with pytest.raises(ArtifactError, match="could not be written"):
        save_artifact(artifact_factory(), target)

    assert target.read_bytes() == b"existing-model"
    assert list(tmp_path.glob(".model.joblib.*.tmp")) == []
