from pathlib import Path

import pytest
from pydantic import ValidationError

from estimator_service.settings import Settings


def test_settings_read_environment(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "estimator.db"
    monkeypatch.setenv("PREDICTION_SERVICE_URL", "https://prediction.example")
    monkeypatch.setenv("PREDICTION_SERVICE_TIMEOUT_SECONDS", "2.5")
    monkeypatch.setenv("ESTIMATOR_DATABASE_PATH", str(database_path))

    settings = Settings()

    assert str(settings.prediction_service_url) == "https://prediction.example/"
    assert settings.prediction_service_timeout_seconds == 2.5
    assert settings.estimator_database_path == database_path


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("PREDICTION_SERVICE_URL", ""),
        ("PREDICTION_SERVICE_URL", "not-a-url"),
        ("PREDICTION_SERVICE_URL", "ftp://prediction.test"),
        ("PREDICTION_SERVICE_TIMEOUT_SECONDS", "0"),
        ("PREDICTION_SERVICE_TIMEOUT_SECONDS", "-1"),
        ("PREDICTION_SERVICE_TIMEOUT_SECONDS", "nan"),
        ("PREDICTION_SERVICE_TIMEOUT_SECONDS", "inf"),
    ],
)
def test_invalid_service_configuration_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
    name: str,
    value: str,
) -> None:
    monkeypatch.setenv(name, value)

    with pytest.raises(ValidationError):
        Settings()
