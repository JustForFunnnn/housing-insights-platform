from __future__ import annotations

import json

import httpx2
import pytest
from asgi_correlation_id import correlation_id

from estimator_service.errors import (
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
)
from estimator_service.models import PropertyFeatures
from estimator_service.prediction_client import HttpPredictionClient
from tests.conftest import VALID_PROPERTY

VALID_PROPERTY_FEATURES = PropertyFeatures(**VALID_PROPERTY)
SUPPLIED_REQUEST_ID = "123e4567-e89b-42d3-a456-426614174000"


@pytest.fixture(autouse=True)
def request_id_context():
    token = correlation_id.set(SUPPLIED_REQUEST_ID)
    try:
        yield
    finally:
        correlation_id.reset(token)


@pytest.mark.anyio
async def test_prediction_client_sends_contract_and_request_id() -> None:
    async def handler(request: httpx2.Request) -> httpx2.Response:
        assert request.url.path == "/api/predict"
        assert request.headers["X-Request-ID"] == SUPPLIED_REQUEST_ID
        assert json.loads(request.read()) == {"instances": [VALID_PROPERTY]}
        return httpx2.Response(200, json={"predictions": [265000]})

    async with httpx2.AsyncClient(
        base_url="http://prediction.test",
        transport=httpx2.MockTransport(handler),
    ) as client:
        predictions = await HttpPredictionClient(client).predict(
            [VALID_PROPERTY_FEATURES],
        )

    assert predictions == [265000]


@pytest.mark.anyio
@pytest.mark.parametrize("status_code", [500, 503])
async def test_prediction_client_maps_server_failures_to_unavailable(
    status_code: int,
) -> None:
    transport = httpx2.MockTransport(
        lambda _request: httpx2.Response(status_code, json={})
    )
    async with httpx2.AsyncClient(
        base_url="http://prediction.test",
        transport=transport,
    ) as client:
        with pytest.raises(PredictionServiceUnavailableError):
            await HttpPredictionClient(client).predict(
                [VALID_PROPERTY_FEATURES],
            )


@pytest.mark.anyio
@pytest.mark.parametrize(
    "response",
    [
        httpx2.Response(422, json={"error_code": "validation_error"}),
        httpx2.Response(200, content=b"not-json"),
        httpx2.Response(200, json={"predictions": [1.5]}),
        httpx2.Response(200, json={"predictions": [0]}),
        httpx2.Response(200, json={"predictions": [2**63]}),
        httpx2.Response(200, json={"predictions": []}),
        httpx2.Response(200, json={"predictions": [1, 2]}),
    ],
)
async def test_prediction_client_rejects_contract_failures(
    response: httpx2.Response,
) -> None:
    transport = httpx2.MockTransport(lambda _request: response)
    async with httpx2.AsyncClient(
        base_url="http://prediction.test",
        transport=transport,
    ) as client:
        with pytest.raises(PredictionServiceInvalidResponseError):
            await HttpPredictionClient(client).predict(
                [VALID_PROPERTY_FEATURES],
            )


@pytest.mark.anyio
async def test_prediction_client_maps_network_failure_to_unavailable() -> None:
    def fail(request: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("offline", request=request)

    async with httpx2.AsyncClient(
        base_url="http://prediction.test",
        transport=httpx2.MockTransport(fail),
    ) as client:
        with pytest.raises(PredictionServiceUnavailableError):
            await HttpPredictionClient(client).predict(
                [VALID_PROPERTY_FEATURES],
            )
