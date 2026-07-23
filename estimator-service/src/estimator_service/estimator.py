from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timezone
from uuid import UUID, uuid4

from estimator_service.data_access import SQLiteEstimateStore
from estimator_service.errors import EstimateNotFoundError
from estimator_service.models import EstimatePage, EstimateRecord, PropertyFeatures
from estimator_service.prediction_client import PredictionClient


class EstimatorService:
    def __init__(
        self,
        prediction_client: PredictionClient,
        store: SQLiteEstimateStore,
    ) -> None:
        self._prediction_client = prediction_client
        self._store = store

    async def create_estimates(
        self,
        properties: Sequence[PropertyFeatures],
    ) -> tuple[EstimateRecord, ...]:
        predictions = await self._prediction_client.predict(properties)
        records = tuple(
            EstimateRecord(
                id=uuid4(),
                property=property_features,
                estimated_price=prediction,
                created_at=datetime.now(timezone.utc),
            )
            for property_features, prediction in zip(
                properties,
                predictions,
                strict=True,
            )
        )
        await self._store.insert_many(records)
        return records

    async def list_estimates(self, limit: int, offset: int) -> EstimatePage:
        estimates, total = await self._store.list_page(
            limit=limit,
            offset=offset,
        )
        return EstimatePage(
            estimates=estimates,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_estimate(self, estimate_id: UUID) -> EstimateRecord:
        record = await self._store.get(estimate_id)
        if record is None:
            raise EstimateNotFoundError(str(estimate_id))
        return record
