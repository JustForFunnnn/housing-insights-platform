from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Sequence
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from uuid import UUID

import aiosqlite

from estimator_service.constants import SQLITE_BUSY_TIMEOUT_MILLISECONDS
from estimator_service.errors import StorageError, StorageUnavailableError
from estimator_service.models import EstimatePage, EstimateRecord, PropertyFeatures

EXPECTED_COLUMNS = (
    "id",
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
    "estimated_price",
    "created_at",
)


class SQLiteEstimateStore:
    """Persist and query estimate records in SQLite."""

    def __init__(
        self,
        database_path: Path,
        busy_timeout_milliseconds: int = SQLITE_BUSY_TIMEOUT_MILLISECONDS,
    ) -> None:
        self.database_path = database_path
        self.busy_timeout_milliseconds = busy_timeout_milliseconds
        self._write_lock = asyncio.Lock()

    async def initialize(self) -> None:
        try:
            self.database_path.parent.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise StorageUnavailableError(
                "could not create database directory"
            ) from exc

        async with self._connection() as connection:
            try:
                await connection.execute("PRAGMA journal_mode=WAL")
                await connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS estimates (
                        id TEXT PRIMARY KEY,
                        square_footage REAL NOT NULL,
                        bedrooms INTEGER NOT NULL,
                        bathrooms REAL NOT NULL,
                        year_built INTEGER NOT NULL,
                        lot_size REAL NOT NULL,
                        distance_to_city_center REAL NOT NULL,
                        school_rating REAL NOT NULL,
                        estimated_price INTEGER NOT NULL,
                        created_at TEXT NOT NULL
                    )
                    """
                )
                await connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_estimates_created_at_id
                    ON estimates (created_at DESC, id DESC)
                    """
                )
                cursor = await connection.execute("PRAGMA table_info(estimates)")
                columns = tuple(row[1] for row in await cursor.fetchall())
                if columns != EXPECTED_COLUMNS:
                    raise StorageUnavailableError("database schema is incompatible")
            except StorageUnavailableError:
                raise
            except aiosqlite.Error as exc:
                raise StorageUnavailableError("could not initialize database") from exc

    @asynccontextmanager
    async def _connection(self) -> AsyncIterator[aiosqlite.Connection]:
        connection: aiosqlite.Connection | None = None
        try:
            connection = await aiosqlite.connect(
                str(self.database_path),
                timeout=self.busy_timeout_milliseconds / 1000,
                isolation_level=None,
            )
            connection.row_factory = aiosqlite.Row
            yield connection
        except StorageError:
            raise
        except (aiosqlite.Error, OSError) as exc:
            raise StorageUnavailableError("database is unavailable") from exc
        finally:
            if connection is not None:
                await connection.close()

    async def health(self) -> None:
        async with self._connection() as connection:
            try:
                await connection.execute("SELECT 1 FROM estimates LIMIT 1")
            except aiosqlite.Error as exc:
                raise StorageUnavailableError(
                    "database health check failed"
                ) from exc

    async def insert_many(self, records: Sequence[EstimateRecord]) -> None:
        async with self._write_lock:
            async with self._connection() as connection:
                try:
                    await connection.execute("BEGIN IMMEDIATE")
                    for record in records:
                        await connection.execute(
                            """
                            INSERT INTO estimates (
                                id,
                                square_footage,
                                bedrooms,
                                bathrooms,
                                year_built,
                                lot_size,
                                distance_to_city_center,
                                school_rating,
                                estimated_price,
                                created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                str(record.id),
                                record.property.square_footage,
                                record.property.bedrooms,
                                record.property.bathrooms,
                                record.property.year_built,
                                record.property.lot_size,
                                record.property.distance_to_city_center,
                                record.property.school_rating,
                                record.estimated_price,
                                record.created_at.isoformat(),
                            ),
                        )
                    await connection.execute("COMMIT")
                except aiosqlite.IntegrityError as exc:
                    await self._rollback(connection)
                    raise StorageError("could not persist estimate batch") from exc
                except aiosqlite.OperationalError as exc:
                    await self._rollback(connection)
                    raise StorageUnavailableError("database write failed") from exc
                except aiosqlite.Error as exc:
                    await self._rollback(connection)
                    raise StorageError("could not persist estimate batch") from exc

    @staticmethod
    async def _rollback(connection: aiosqlite.Connection) -> None:
        try:
            await connection.execute("ROLLBACK")
        except aiosqlite.Error:
            pass

    async def list(self, limit: int, offset: int) -> EstimatePage:
        async with self._connection() as connection:
            try:
                cursor = await connection.execute("SELECT COUNT(*) FROM estimates")
                total_row = await cursor.fetchone()
                total = int(total_row[0])
                cursor = await connection.execute(
                    """
                    SELECT * FROM estimates
                    ORDER BY created_at DESC, id DESC
                    LIMIT ? OFFSET ?
                    """,
                    (limit, offset),
                )
                records = tuple(
                    self._record_from_row(row) for row in await cursor.fetchall()
                )
            except aiosqlite.Error as exc:
                raise StorageUnavailableError("database read failed") from exc
        return EstimatePage(
            estimates=records,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get(self, estimate_id: UUID) -> EstimateRecord | None:
        async with self._connection() as connection:
            try:
                cursor = await connection.execute(
                    "SELECT * FROM estimates WHERE id = ?",
                    (str(estimate_id),),
                )
                row = await cursor.fetchone()
            except aiosqlite.Error as exc:
                raise StorageUnavailableError("database read failed") from exc
        return None if row is None else self._record_from_row(row)

    @staticmethod
    def _record_from_row(row: aiosqlite.Row) -> EstimateRecord:
        return EstimateRecord(
            id=UUID(row["id"]),
            property=PropertyFeatures(
                square_footage=row["square_footage"],
                bedrooms=row["bedrooms"],
                bathrooms=row["bathrooms"],
                year_built=row["year_built"],
                lot_size=row["lot_size"],
                distance_to_city_center=row["distance_to_city_center"],
                school_rating=row["school_rating"],
            ),
            estimated_price=row["estimated_price"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )
