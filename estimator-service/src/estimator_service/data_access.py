from __future__ import annotations

from collections.abc import AsyncIterator, Sequence
from contextlib import asynccontextmanager
from typing import Protocol

from sqlalchemy import func, select
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from estimator_service.errors import StorageError, StorageUnavailableError
from estimator_service.models import EstimateRecord, PropertyFeatures
from estimator_service.tables import Base, EstimateRow


class EstimateStore(Protocol):
    async def initialize_schema(self) -> None: ...

    async def aclose(self) -> None: ...

    async def health(self) -> None: ...

    async def insert_many(self, records: Sequence[EstimateRecord]) -> None: ...

    async def list_page(
        self,
        limit: int,
        offset: int,
    ) -> tuple[tuple[EstimateRecord, ...], int]: ...


class PostgresEstimateStore:
    """Persist and query estimate records through SQLAlchemy ORM."""

    def __init__(self, database_url: str | URL) -> None:
        self._engine = self._create_engine(database_url)
        self._sessions = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
        )

    @staticmethod
    def _create_engine(database_url: str | URL) -> AsyncEngine:
        url = make_url(database_url)
        if url.drivername != "postgresql+asyncpg":
            raise ValueError(
                "database URL must use the postgresql+asyncpg driver"
            )
        return create_async_engine(
            url,
            hide_parameters=True,
            pool_pre_ping=True,
        )

    async def initialize_schema(self) -> None:
        """Create database objects missing from the ORM metadata."""
        try:
            async with self._engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
        except SQLAlchemyError as exc:
            raise StorageUnavailableError(
                "could not initialize database schema"
            ) from exc

    async def aclose(self) -> None:
        await self._engine.dispose()

    async def health(self) -> None:
        async with self._read_session("database health check failed") as session:
            await session.scalar(select(EstimateRow).limit(1))

    async def insert_many(self, records: Sequence[EstimateRecord]) -> None:
        rows = [self._row_from_record(record) for record in records]
        if not rows:
            return

        async with self._write_session() as session:
            session.add_all(rows)

    async def list_page(
        self,
        limit: int,
        offset: int,
    ) -> tuple[tuple[EstimateRecord, ...], int]:
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
            total = await session.scalar(
                select(func.count()).select_from(EstimateRow)
            )
        return records, int(total or 0)

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
            square_footage=record.property.square_footage,
            bedrooms=record.property.bedrooms,
            bathrooms=record.property.bathrooms,
            year_built=record.property.year_built,
            lot_size=record.property.lot_size,
            distance_to_city_center=record.property.distance_to_city_center,
            school_rating=record.property.school_rating,
            estimated_price=record.estimated_price,
            created_at=record.created_at,
        )

    @staticmethod
    def _record_from_row(row: EstimateRow) -> EstimateRecord:
        return EstimateRecord(
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
            created_at=row.created_at,
        )
