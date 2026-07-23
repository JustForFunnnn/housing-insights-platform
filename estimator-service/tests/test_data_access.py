from __future__ import annotations

from pathlib import Path

import pytest

from estimator_service.database.initialize import initialize_database
from estimator_service.errors import StorageUnavailableError


def test_database_initializer_rejects_unusable_parent(tmp_path: Path) -> None:
    blocker = tmp_path / "not-a-directory"
    blocker.write_text("blocked", encoding="utf-8")

    with pytest.raises(StorageUnavailableError, match="database directory"):
        initialize_database(blocker / "estimator.db")
