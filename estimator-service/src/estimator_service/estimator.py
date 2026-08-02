from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timezone

from estimator_service import domain
from estimator_service.data_access import EstimateStore
from estimator_service.prediction_client import PredictionClient


class EstimatorService:
    def __init__(
        self,
        prediction_client: PredictionClient,
        store: EstimateStore,
    ) -> None:
        self._prediction_client = prediction_client
        self._store = store

    async def create_estimates(
        self,
        properties: Sequence[domain.PropertyFeatures],
    ) -> tuple[domain.Estimate, ...]:
        predictions = await self._prediction_client.predict(properties)
        estimates = tuple(
            domain.Estimate(
                property_features=property_features,
                estimated_price=prediction,
                created_at=datetime.now(timezone.utc),
            )
            for property_features, prediction in zip(
                properties,
                predictions,
                strict=True,
            )
        )
        await self._store.insert_many(estimates)
        return estimates

    async def list_estimates(self, limit: int, offset: int) -> domain.EstimatePage:
        estimates, total = await self._store.list_page(
            limit=limit,
            offset=offset,
        )
        return domain.EstimatePage(
            estimates=estimates,
            total=total,
            limit=limit,
            offset=offset,
        )
