from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Sequence
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.engine import URL
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from estimator_service.constants import SQLITE_BUSY_TIMEOUT_MILLISECONDS
from estimator_service.database.orm import EstimateRow
from estimator_service.errors import StorageError, StorageUnavailableError
from estimator_service.models import EstimateRecord, PropertyFeatures


class SQLiteEstimateStore:
    """Persist and query estimate records through SQLAlchemy ORM."""

    def __init__(
        self,
        database_path: Path,
        busy_timeout_milliseconds: int = SQLITE_BUSY_TIMEOUT_MILLISECONDS,
    ) -> None:
        self.database_path = database_path
        self.busy_timeout_milliseconds = busy_timeout_milliseconds
        self._write_lock = asyncio.Lock()
        self._engine = self._create_engine()
        self._sessions = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
        )

    def _create_engine(self) -> AsyncEngine:
        database_url = URL.create(
            "sqlite+aiosqlite",
            database=str(self.database_path.resolve()),
        )
        return create_async_engine(
            database_url,
            connect_args={
                "timeout": self.busy_timeout_milliseconds / 1000,
            },
            poolclass=NullPool,
        )

    async def verify_schema(self) -> None:
        """Verify the externally initialized schema without creating it."""
        try:
            if not self.database_path.is_file():
                raise StorageUnavailableError(
                    "database has not been initialized"
                )
        except OSError as exc:
            raise StorageUnavailableError("database is unavailable") from exc

        await self.health()

    async def aclose(self) -> None:
        await self._engine.dispose()

    async def health(self) -> None:
        async with self._read_session("database health check failed") as session:
            await session.scalar(select(EstimateRow).limit(1))

    async def insert_many(self, records: Sequence[EstimateRecord]) -> None:
        rows = [self._row_from_record(record) for record in records]
        if not rows:
            return

        async with self._write_lock:
            async with self._write_session() as session:
                session.add_all(rows)

    async def list(
        self,
        limit: int,
        offset: int,
    ) -> tuple[EstimateRecord, ...]:
        async with self._read_session() as session:
            result = await session.scalars(
                select(EstimateRow)
                .order_by(
                    EstimateRow.created_at.desc(),
                    EstimateRow.id.desc(),
                )
                .limit(limit)
                .offset(offset)
            )
            records = tuple(
                self._record_from_row(row) for row in result.all()
            )
        return records

    async def count(self) -> int:
        async with self._read_session() as session:
            total = await session.scalar(
                select(func.count()).select_from(EstimateRow)
            )
        return int(total or 0)

    async def get(self, estimate_id: UUID) -> EstimateRecord | None:
        async with self._read_session() as session:
            row = await session.scalar(
                select(EstimateRow).where(
                    EstimateRow.id == str(estimate_id)
                )
            )
        return None if row is None else self._record_from_row(row)

    @asynccontextmanager
    async def _read_session(
        self,
        error_message: str = "database read failed",
    ) -> AsyncIterator[AsyncSession]:
        try:
            async with self._sessions() as session:
                yield session
        except SQLAlchemyError as exc:
            raise StorageUnavailableError(error_message) from exc

    @asynccontextmanager
    async def _write_session(self) -> AsyncIterator[AsyncSession]:
        try:
            async with self._sessions.begin() as session:
                yield session
        except IntegrityError as exc:
            raise StorageError("could not persist estimate batch") from exc
        except OperationalError as exc:
            raise StorageUnavailableError("database write failed") from exc
        except SQLAlchemyError as exc:
            raise StorageError("could not persist estimate batch") from exc

    @staticmethod
    def _row_from_record(record: EstimateRecord) -> EstimateRow:
        return EstimateRow(
            id=str(record.id),
            square_footage=record.property.square_footage,
            bedrooms=record.property.bedrooms,
            bathrooms=record.property.bathrooms,
            year_built=record.property.year_built,
            lot_size=record.property.lot_size,
            distance_to_city_center=record.property.distance_to_city_center,
            school_rating=record.property.school_rating,
            estimated_price=record.estimated_price,
            created_at=record.created_at.isoformat(),
        )

    @staticmethod
    def _record_from_row(row: EstimateRow) -> EstimateRecord:
        return EstimateRecord(
            id=UUID(row.id),
            property=PropertyFeatures(
                square_footage=row.square_footage,
                bedrooms=row.bedrooms,
                bathrooms=row.bathrooms,
                year_built=row.year_built,
                lot_size=row.lot_size,
                distance_to_city_center=row.distance_to_city_center,
                school_rating=row.school_rating,
            ),
            estimated_price=row.estimated_price,
            created_at=datetime.fromisoformat(row.created_at),
        )
