from pathlib import Path

import pytest

from prediction_service.artifact import (
    ArtifactError,
    load_artifact,
    save_artifact,
    validate_artifact,
)
from prediction_service.models import FEATURE_NAMES


def test_valid_artifact_round_trips(tmp_path: Path, artifact_factory) -> None:
    path = tmp_path / "nested" / "model.joblib"

    save_artifact(artifact_factory(), path)
    loaded = load_artifact(path)

    assert path.is_file()
    assert loaded["features"] == list(FEATURE_NAMES)


@pytest.mark.parametrize(
    "mutation",
    [
        lambda artifact: artifact.update(features=list(reversed(FEATURE_NAMES))),
        lambda artifact: artifact.update(trained_at="2026-07-21T12:00:00"),
        lambda artifact: artifact.pop("cross_validation"),
        lambda artifact: artifact["cross_validation"]["metrics"]["rmse"].update(
            mean=float("nan")
        ),
    ],
)
def test_incompatible_artifact_is_rejected(artifact_factory, mutation) -> None:
    artifact = artifact_factory()
    mutation(artifact)

    with pytest.raises(ArtifactError):
        validate_artifact(artifact)


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
