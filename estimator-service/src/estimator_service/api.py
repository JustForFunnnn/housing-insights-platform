from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status

from estimator_service.constants import (
    DEFAULT_PAGE_LIMIT,
    DEFAULT_PAGE_OFFSET,
    MAX_PAGE_LIMIT,
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

router = APIRouter(
    responses={
        500: {
            "model": ErrorResponse,
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
        422: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
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
    responses={422: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
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
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
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
    responses={503: {"model": ErrorResponse}},
)
async def health(
    store: SQLiteEstimateStore = Depends(get_estimate_store),
) -> HealthResponse:
    await store.health()
    return HealthResponse(status="ok")
