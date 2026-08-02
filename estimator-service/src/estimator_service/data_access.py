from __future__ import annotations

from collections.abc import AsyncGenerator, Sequence
from contextlib import AbstractAsyncContextManager, asynccontextmanager
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

from estimator_service import domain
from estimator_service.errors import StorageError, StorageUnavailableError
from estimator_service.tables import Base, EstimateRow


class Database(Protocol):
    def session(self) -> AbstractAsyncContextManager[AsyncSession]: ...

    def transaction(self) -> AbstractAsyncContextManager[AsyncSession]: ...

    async def initialize_schema(self) -> None: ...

    async def health(self) -> None: ...

    async def aclose(self) -> None: ...


class EstimateStore(Protocol):
    async def insert_many(self, estimates: Sequence[domain.Estimate]) -> None: ...

    async def list_page(
        self,
        limit: int,
        offset: int,
    ) -> tuple[tuple[domain.Estimate, ...], int]: ...


class PostgresDatabase:
    """Own the PostgreSQL engine, sessions, and application lifecycle."""

    def __init__(self, database_url: str | URL) -> None:
        url = make_url(database_url)
        if url.drivername != "postgresql+asyncpg":
            raise ValueError("database URL must use the postgresql+asyncpg driver")
        self._engine: AsyncEngine = create_async_engine(
            url,
            hide_parameters=True,
            pool_pre_ping=True,
        )
        self._sessions = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
        )

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self._sessions() as session:
            yield session

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[AsyncSession, None]:
        async with self._sessions.begin() as session:
            yield session

    async def initialize_schema(self) -> None:
        """Create database objects missing from the ORM metadata."""
        try:
            async with self._engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
        except SQLAlchemyError as exc:
            raise StorageUnavailableError("could not initialize database schema") from exc

    async def health(self) -> None:
        try:
            async with self.session() as session:
                await session.scalar(select(EstimateRow).limit(1))
        except SQLAlchemyError as exc:
            raise StorageUnavailableError("database health check failed") from exc

    async def aclose(self) -> None:
        await self._engine.dispose()


class PostgresEstimateStore:
    """Persist and query estimate records through SQLAlchemy ORM."""

    def __init__(self, database: Database) -> None:
        self._database = database

    async def insert_many(self, estimates: Sequence[domain.Estimate]) -> None:
        rows = [self._row_from_estimate(estimate) for estimate in estimates]
        if not rows:
            return

        try:
            async with self._database.transaction() as session:
                session.add_all(rows)
        except IntegrityError as exc:
            raise StorageError("could not persist estimate batch") from exc
        except OperationalError as exc:
            raise StorageUnavailableError("database write failed") from exc
        except SQLAlchemyError as exc:
            raise StorageError("could not persist estimate batch") from exc

    async def list_page(
        self,
        limit: int,
        offset: int,
    ) -> tuple[tuple[domain.Estimate, ...], int]:
        try:
            async with self._database.session() as session:
                result = await session.scalars(
                    select(EstimateRow)
                    .order_by(
                        EstimateRow.created_at.desc(),
                        EstimateRow.id.desc(),
                    )
                    .limit(limit)
                    .offset(offset)
                )
                estimates = tuple(self._estimate_from_row(row) for row in result.all())
                total = await session.scalar(select(func.count()).select_from(EstimateRow))
        except SQLAlchemyError as exc:
            raise StorageUnavailableError("database read failed") from exc
        return estimates, int(total or 0)

    @staticmethod
    def _row_from_estimate(estimate: domain.Estimate) -> EstimateRow:
        property_features = estimate.property_features
        return EstimateRow(
            square_footage=property_features.square_footage,
            bedrooms=property_features.bedrooms,
            bathrooms=property_features.bathrooms,
            year_built=property_features.year_built,
            lot_size=property_features.lot_size,
            distance_to_city_center=property_features.distance_to_city_center,
            school_rating=property_features.school_rating,
            estimated_price=estimate.estimated_price,
            created_at=estimate.created_at,
        )

    @staticmethod
    def _estimate_from_row(row: EstimateRow) -> domain.Estimate:
        return domain.Estimate(
            property_features=domain.PropertyFeatures(
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
