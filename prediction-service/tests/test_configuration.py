from pathlib import Path

import pytest

from prediction_service.settings import Settings


def test_settings_read_environment(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    artifact_path = tmp_path / "model.joblib"
    monkeypatch.setenv("MODEL_ARTIFACT_PATH", str(artifact_path))

    settings = Settings()

    assert settings.model_artifact_path == artifact_path
