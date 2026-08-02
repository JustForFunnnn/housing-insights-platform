from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request, status

from estimator_service import schemas
from estimator_service.constants import (
    DEFAULT_PAGE_LIMIT,
    DEFAULT_PAGE_OFFSET,
    MAX_PAGE_LIMIT,
    REQUEST_ID_HEADER,
)
from estimator_service.data_access import Database
from estimator_service.estimator import EstimatorService
from estimator_service.property_metadata import PROPERTY_METADATA

RESPONSE_WITH_REQUEST_ID = {
    "headers": {
        REQUEST_ID_HEADER: {
            "description": "The active request correlation identifier.",
            "schema": {"type": "string"},
        }
    }
}
ERROR_RESPONSE_WITH_REQUEST_ID = {
    "model": schemas.ErrorResponse,
    **RESPONSE_WITH_REQUEST_ID,
}


def document_request_id(
    _request_id: Annotated[
        str | None,
        Header(
            alias=REQUEST_ID_HEADER,
            description=(
                "Optional UUID4 request identifier. Valid values are preserved "
                "exactly; missing or invalid values are replaced with a compact "
                "UUID4."
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
    },
)


def get_estimator_service(request: Request) -> EstimatorService:
    return request.app.state.estimator_service


def get_database(request: Request) -> Database:
    return request.app.state.database


@router.post(
    "/estimates",
    response_model=schemas.EstimateBatchResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        502: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def create_estimates(
    payload: schemas.EstimateBatchRequest,
    service: EstimatorService = Depends(get_estimator_service),
) -> schemas.EstimateBatchResponse:
    estimates = await service.create_estimates(
        [item.to_features() for item in payload.properties],
    )
    return schemas.EstimateBatchResponse.from_estimates(estimates)


@router.get(
    "/estimates",
    response_model=schemas.EstimatePageResponse,
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
) -> schemas.EstimatePageResponse:
    page = await service.list_estimates(limit=limit, offset=offset)
    return schemas.EstimatePageResponse.from_page(page)


@router.get(
    "/metadata",
    response_model=schemas.PropertyMetadataResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def estimate_metadata() -> schemas.PropertyMetadataResponse:
    return schemas.PropertyMetadataResponse.from_metadata(PROPERTY_METADATA)


@router.get(
    "/health",
    response_model=schemas.HealthResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
        503: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
async def health(
    database: Database = Depends(get_database),
) -> schemas.HealthResponse:
    await database.health()
    return schemas.HealthResponse(status="ok")
