from __future__ import annotations

import logging
from collections.abc import Mapping
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from estimator_service.api import router
from estimator_service.constants import (
    ErrorCode,
    ESTIMATOR_DATABASE_PATH,
    PREDICTION_SERVICE_TIMEOUT_SECONDS,
    PREDICTION_SERVICE_URL,
    REQUEST_ID_HEADER,
)
from estimator_service.data_access import SQLiteEstimateStore
from estimator_service.estimator import EstimatorService
from estimator_service.errors import (
    EstimateNotFoundError,
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
    StorageUnavailableError,
)
from estimator_service.observability import (
    configure_logging,
    correlate_request,
    request_id_from_request,
)
from estimator_service.prediction_client import (
    HttpPredictionClient,
    PredictionClient,
)
from estimator_service.schemas import ErrorResponse

LOGGER = logging.getLogger(__name__)


def create_app(
    prediction_client: PredictionClient | None = None,
    store: SQLiteEstimateStore | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        configure_logging()
        selected_store = store or SQLiteEstimateStore(ESTIMATOR_DATABASE_PATH)
        await selected_store.initialize()

        owned_prediction_client: HttpPredictionClient | None = None
        selected_prediction_client = prediction_client
        if selected_prediction_client is None:
            owned_prediction_client = HttpPredictionClient(
                base_url=PREDICTION_SERVICE_URL,
                timeout=PREDICTION_SERVICE_TIMEOUT_SECONDS,
            )
            selected_prediction_client = owned_prediction_client

        application.state.estimate_store = selected_store
        application.state.estimator_service = EstimatorService(
            selected_prediction_client,
            selected_store,
        )
        LOGGER.info("database_ready path=%s", selected_store.database_path)
        try:
            yield
        finally:
            if owned_prediction_client is not None:
                await owned_prediction_client.aclose()

    application = FastAPI(
        title="Housing Insights Estimator Service",
        description="Create and persist property value estimates.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.include_router(router)
    application.middleware("http")(correlate_request)
    _register_error_handlers(application)

    return application


def _error_response(
    request: Request,
    status_code: int,
    error_code: ErrorCode,
    message: str,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    request_id = request_id_from_request(request)
    response_headers = dict(headers or {})
    response_headers[REQUEST_ID_HEADER] = request_id
    body = ErrorResponse(error_code=error_code, message=message)
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(),
        headers=response_headers,
    )


def _register_error_handlers(application: FastAPI) -> None:
    @application.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request,
        _exc: RequestValidationError,
    ) -> JSONResponse:
        return _error_response(
            request,
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="Request validation failed.",
        )

    @application.exception_handler(EstimateNotFoundError)
    async def estimate_not_found(
        request: Request,
        _exc: EstimateNotFoundError,
    ) -> JSONResponse:
        return _error_response(
            request,
            status_code=404,
            error_code=ErrorCode.ESTIMATE_NOT_FOUND,
            message="The estimate was not found.",
        )

    @application.exception_handler(PredictionServiceUnavailableError)
    async def prediction_unavailable(
        request: Request,
        exc: PredictionServiceUnavailableError,
    ) -> JSONResponse:
        LOGGER.error(
            "prediction_unavailable request_id=%s error=%s",
            request_id_from_request(request),
            exc,
        )
        return _error_response(
            request,
            status_code=503,
            error_code=ErrorCode.PREDICTION_SERVICE_UNAVAILABLE,
            message="Price estimation is temporarily unavailable.",
        )

    @application.exception_handler(PredictionServiceInvalidResponseError)
    async def prediction_invalid_response(
        request: Request,
        exc: PredictionServiceInvalidResponseError,
    ) -> JSONResponse:
        LOGGER.error(
            "prediction_invalid_response request_id=%s error=%s",
            request_id_from_request(request),
            exc,
        )
        return _error_response(
            request,
            status_code=502,
            error_code=ErrorCode.PREDICTION_SERVICE_INVALID_RESPONSE,
            message="The prediction service returned an invalid response.",
        )

    @application.exception_handler(StorageUnavailableError)
    async def database_unavailable(
        request: Request,
        exc: StorageUnavailableError,
    ) -> JSONResponse:
        LOGGER.error(
            "database_unavailable request_id=%s error=%s",
            request_id_from_request(request),
            exc,
        )
        return _error_response(
            request,
            status_code=503,
            error_code=ErrorCode.DATABASE_UNAVAILABLE,
            message="The estimator database is temporarily unavailable.",
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_error(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        return _error_response(
            request,
            status_code=exc.status_code,
            error_code=ErrorCode.HTTP_ERROR,
            message="The request could not be completed.",
            headers=exc.headers,
        )

    @application.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        LOGGER.exception(
            "request_failed request_id=%s method=%s path=%s status=500 error=%s",
            request_id_from_request(request),
            request.method,
            request.url.path,
            exc,
        )
        return _error_response(
            request,
            status_code=500,
            error_code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected server error occurred.",
        )


app = create_app()
