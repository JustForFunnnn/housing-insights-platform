from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, status

from estimator_service.constants import (
    DEFAULT_PAGE_LIMIT,
    DEFAULT_PAGE_OFFSET,
    MAX_PAGE_LIMIT,
    REQUEST_ID_HEADER,
)
from estimator_service.data_access import SQLiteEstimateStore
from estimator_service.schemas import (
    ErrorResponse,
    EstimateBatchResponse,
    EstimatePageResponse,
    EstimateRecordResponse,
    EstimateRequest,
    HealthResponse,
)
from estimator_service.estimator import EstimatorService

RESPONSE_WITH_REQUEST_ID = {
    "headers": {
        REQUEST_ID_HEADER: {
            "description": "The active request correlation identifier.",
            "schema": {"type": "string"},
        }
    }
}
ERROR_RESPONSE_WITH_REQUEST_ID = {
    "model": ErrorResponse,
    **RESPONSE_WITH_REQUEST_ID,
}


def document_request_id(
    _request_id: Annotated[
        str | None,
        Header(
            alias=REQUEST_ID_HEADER,
            description=(
                "Optional UUID4 request identifier. Missing or invalid values "
                "are replaced."
            ),
        ),
    ] = None,
) -> None:
    """Expose middleware-owned request correlation in OpenAPI."""


router = APIRouter(
    dependencies=[Depends(document_request_id)],
    responses={
        500: {
            **ERROR_RESPONSE_WITH_REQUEST_ID,
            "description": "The request could not be completed.",
        }
    }
)


def get_estimator_service(request: Request) -> EstimatorService:
    return request.app.state.estimator_service


def get_estimate_store(request: Request) -> SQLiteEstimateStore:
    return request.app.state.estimate_store


@router.post(
    "/estimates",
    response_model=EstimateBatchResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        502: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def create_estimates(
    payload: EstimateRequest,
    service: EstimatorService = Depends(get_estimator_service),
) -> EstimateBatchResponse:
    records = await service.create_estimates(
        [item.to_features() for item in payload.properties],
    )
    return EstimateBatchResponse.from_records(records)


@router.get(
    "/estimates",
    response_model=EstimatePageResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def list_estimates(
    limit: Annotated[int, Query(ge=1, le=MAX_PAGE_LIMIT)] = DEFAULT_PAGE_LIMIT,
    offset: Annotated[int, Query(ge=0)] = DEFAULT_PAGE_OFFSET,
    service: EstimatorService = Depends(get_estimator_service),
) -> EstimatePageResponse:
    page = await service.list_estimates(limit=limit, offset=offset)
    return EstimatePageResponse.from_page(page)


@router.get(
    "/estimates/{estimate_id}",
    response_model=EstimateRecordResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        404: ERROR_RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def get_estimate(
    estimate_id: UUID,
    service: EstimatorService = Depends(get_estimator_service),
) -> EstimateRecordResponse:
    return EstimateRecordResponse.from_record(
        await service.get_estimate(estimate_id)
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def health(
    store: SQLiteEstimateStore = Depends(get_estimate_store),
) -> HealthResponse:
    await store.health()
    return HealthResponse(status="ok")
