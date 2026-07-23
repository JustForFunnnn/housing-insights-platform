from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol

import httpx2

from estimator_service.constants import (
    PREDICTION_SERVICE_TIMEOUT_SECONDS,
    PREDICTION_SERVICE_URL,
    REQUEST_ID_HEADER,
)
from estimator_service.errors import (
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
)
from estimator_service.models import PropertyFeatures
from estimator_service.schemas import PredictionResponse


class PredictionClient(Protocol):
    """Port for requesting ordered price predictions."""

    async def predict(
        self,
        properties: Sequence[PropertyFeatures],
        request_id: str,
    ) -> list[int]: ...


class HttpPredictionClient:
    def __init__(
        self,
        client: httpx2.AsyncClient | None = None,
        base_url: str = PREDICTION_SERVICE_URL,
        timeout: float = PREDICTION_SERVICE_TIMEOUT_SECONDS,
    ) -> None:
        self._owns_client = client is None
        self._client = (
            client
            if client is not None
            else httpx2.AsyncClient(base_url=base_url, timeout=timeout)
        )

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def predict(
        self,
        properties: Sequence[PropertyFeatures],
        request_id: str,
    ) -> list[int]:
        try:
            response = await self._client.post(
                "/predict",
                json={"instances": [item.as_dict() for item in properties]},
                headers={REQUEST_ID_HEADER: request_id},
            )
        except (httpx2.TimeoutException, httpx2.RequestError) as exc:
            raise PredictionServiceUnavailableError(
                "prediction service request failed"
            ) from exc

        if response.status_code >= 500:
            raise PredictionServiceUnavailableError(
                f"prediction service returned status {response.status_code}"
            )
        if response.status_code >= 400:
            raise PredictionServiceInvalidResponseError(
                "prediction service rejected generated request with status "
                f"{response.status_code}"
            )

        try:
            payload = PredictionResponse.model_validate(response.json())
        except ValueError as exc:
            raise PredictionServiceInvalidResponseError(
                "prediction service returned an invalid response"
            ) from exc

        expected_count = len(properties)
        if (
            payload.count != expected_count
            or len(payload.predictions) != expected_count
        ):
            raise PredictionServiceInvalidResponseError(
                "prediction service returned the wrong number of predictions"
            )
        return payload.predictions
