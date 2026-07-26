from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol

import httpx2
from housing_common.observability import current_request_id

from estimator_service.constants import REQUEST_ID_HEADER
from estimator_service.errors import (
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
)
from estimator_service.models import PropertyFeatures
from estimator_service.schemas import PredictionResponse
from estimator_service.settings import Settings


class PredictionClient(Protocol):
    """Port for requesting ordered price predictions."""

    async def predict(
        self,
        properties: Sequence[PropertyFeatures],
    ) -> list[int]: ...


class HttpPredictionClient:
    def __init__(
        self,
        client: httpx2.AsyncClient | None = None,
        base_url: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self._should_close_client = False
        if client is None:
            if base_url is None or timeout is None:
                settings = Settings()
                if base_url is None:
                    base_url = str(settings.prediction_service_url)
                if timeout is None:
                    timeout = settings.prediction_service_timeout_seconds
            client = httpx2.AsyncClient(
                base_url=base_url,
                timeout=timeout,
            )
            self._should_close_client = True
        self._client = client

    async def aclose(self) -> None:
        if self._should_close_client:
            await self._client.aclose()

    async def predict(
        self,
        properties: Sequence[PropertyFeatures],
    ) -> list[int]:
        response = await self._request(
            method="POST",
            path="/api/predict",
            json={"instances": [item.as_dict() for item in properties]},
        )

        try:
            payload = PredictionResponse.model_validate(response.json())
        except ValueError as exc:
            raise PredictionServiceInvalidResponseError(
                "prediction service returned an invalid response"
            ) from exc

        if len(payload.predictions) != len(properties):
            raise PredictionServiceInvalidResponseError(
                "prediction service returned the wrong number of predictions"
            )
        return payload.predictions

    async def _request(
        self,
        method: str,
        path: str,
        json: object | None = None,
    ) -> httpx2.Response:
        try:
            response = await self._client.request(
                method,
                path,
                json=json,
                headers={REQUEST_ID_HEADER: current_request_id()},
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
                "prediction service rejected request with status "
                f"{response.status_code}"
            )
        return response
