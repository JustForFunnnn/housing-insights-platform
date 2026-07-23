from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import URL

from estimator_service.database.initialize import initialize_database
from estimator_service.errors import StorageUnavailableError


def test_database_initializer_creates_metadata_schema(tmp_path: Path) -> None:
    database_path = tmp_path / "estimator.db"

    initialize_database(database_path)

    engine = create_engine(
        URL.create(
            "sqlite+pysqlite",
            database=str(database_path.resolve()),
        )
    )
    try:
        schema = inspect(engine)
        assert "estimates" in schema.get_table_names()
    finally:
        engine.dispose()


def test_database_initializer_rejects_unusable_parent(tmp_path: Path) -> None:
    blocker = tmp_path / "not-a-directory"
    blocker.write_text("blocked", encoding="utf-8")

    with pytest.raises(StorageUnavailableError, match="database directory"):
        initialize_database(blocker / "estimator.db")
