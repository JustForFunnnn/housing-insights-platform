from __future__ import annotations

import argparse
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.exc import SQLAlchemyError

from estimator_service.errors import StorageUnavailableError
from estimator_service.settings import Settings

DDL_PATH = Path(__file__).parent / "ddl" / "estimate.sql"


def initialize_database(database_path: Path) -> None:
    """Create the SQLite schema by executing the maintained SQL file."""
    try:
        database_path.parent.mkdir(parents=True, exist_ok=True)
        ddl_sql = DDL_PATH.read_text(encoding="utf-8")
    except OSError as exc:
        raise StorageUnavailableError(
            "could not read schema or create database directory"
        ) from exc

    engine = create_engine(
        URL.create(
            "sqlite+pysqlite",
            database=str(database_path.resolve()),
        )
    )
    try:
        with engine.begin() as connection:
            for statement in ddl_sql.split(";"):
                if statement := statement.strip():
                    connection.exec_driver_sql(statement)
    except SQLAlchemyError as exc:
        raise StorageUnavailableError("could not initialize database") from exc
    finally:
        engine.dispose()


def _parser(app_settings: Settings | None = None) -> argparse.ArgumentParser:
    if app_settings is None:
        app_settings = Settings()
    parser = argparse.ArgumentParser(
        description="Initialize the estimator SQLite database",
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=app_settings.estimator_database_path,
        help=(
            "database path "
            f"(default: {app_settings.estimator_database_path})"
        ),
    )
    return parser


def main() -> None:
    args = _parser().parse_args()
    initialize_database(args.database)


if __name__ == "__main__":
    main()
