from __future__ import annotations

import logging
from collections.abc import Mapping
from contextlib import asynccontextmanager

from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from estimator_service.api import router
from estimator_service.constants import REQUEST_ID_HEADER
from estimator_service.data_access import Database, EstimateStore, PostgresDatabase, PostgresEstimateStore
from estimator_service.estimator import EstimatorService
from estimator_service.errors import (
    ErrorCode,
    PredictionServiceInvalidResponseError,
    PredictionServiceUnavailableError,
    StorageError,
    StorageUnavailableError,
)
from estimator_service.observability import (
    configure_logging,
    current_request_id,
    log_request,
)
from estimator_service.prediction_client import (
    HttpPredictionClient,
    PredictionClient,
)
from estimator_service.schemas import ErrorResponse
from estimator_service.settings import Settings

logger = logging.getLogger(__name__)


def create_app(
    prediction_client: PredictionClient | None = None,
    database: Database | None = None,
    store: EstimateStore | None = None,
    app_settings: Settings | None = None,
) -> FastAPI:
    if app_settings is None:
        app_settings = Settings()

    should_close_database = False
    if database is None:
        database = PostgresDatabase(str(app_settings.estimator_database_url))
        should_close_database = True

    if store is None:
        store = PostgresEstimateStore(database)

    should_close_prediction_client = False
    if prediction_client is None:
        prediction_client = HttpPredictionClient(
            base_url=str(app_settings.prediction_service_url),
            timeout=app_settings.prediction_service_timeout_seconds,
        )
        should_close_prediction_client = True

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        configure_logging()
        try:
            await database.initialize_schema()
            await database.health()
            application.state.database = database
            application.state.estimator_service = EstimatorService(
                prediction_client,
                store,
            )
            logger.info("database_ready")
            yield
        finally:
            if should_close_prediction_client:
                await prediction_client.aclose()
            if should_close_database:
                await database.aclose()

    application = FastAPI(
        title="Housing Insights Estimator Service",
        description="Create and persist property value estimates.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.include_router(router, prefix="/api")
    application.middleware("http")(log_request)
    application.add_middleware(
        CorrelationIdMiddleware,
        header_name=REQUEST_ID_HEADER,
    )
    _register_error_handlers(application)

    return application


def _error_response(
    status_code: int,
    error_code: ErrorCode,
    message: str,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    response_headers = dict(headers or {})
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
        exc: RequestValidationError,
    ) -> JSONResponse:
        errors = exc.errors()
        reason = errors[0]["msg"] if errors else str(exc)
        logger.info(
            "request_validation_failed method=%s path=%s reason=%s",
            request.method,
            request.url.path,
            reason,
        )
        return _error_response(
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="Request validation failed.",
        )

    @application.exception_handler(PredictionServiceUnavailableError)
    async def prediction_unavailable(
        _request: Request,
        exc: PredictionServiceUnavailableError,
    ) -> JSONResponse:
        logger.error("prediction_unavailable error=%s", exc, exc_info=exc)
        return _error_response(
            status_code=503,
            error_code=ErrorCode.PREDICTION_SERVICE_UNAVAILABLE,
            message="Price estimation is temporarily unavailable.",
        )

    @application.exception_handler(PredictionServiceInvalidResponseError)
    async def prediction_invalid_response(
        _request: Request,
        exc: PredictionServiceInvalidResponseError,
    ) -> JSONResponse:
        logger.error("prediction_invalid_response error=%s", exc, exc_info=exc)
        return _error_response(
            status_code=502,
            error_code=ErrorCode.PREDICTION_SERVICE_INVALID_RESPONSE,
            message="The prediction service returned an invalid response.",
        )

    @application.exception_handler(StorageUnavailableError)
    async def database_unavailable(
        _request: Request,
        exc: StorageUnavailableError,
    ) -> JSONResponse:
        logger.error("database_unavailable error=%s", exc, exc_info=exc)
        return _error_response(
            status_code=503,
            error_code=ErrorCode.DATABASE_UNAVAILABLE,
            message="The estimator database is temporarily unavailable.",
        )

    @application.exception_handler(StorageError)
    async def database_operation_failed(
        _request: Request,
        exc: StorageError,
    ) -> JSONResponse:
        logger.error("database_operation_failed error=%s", exc, exc_info=exc)
        return _error_response(
            status_code=500,
            error_code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected server error occurred.",
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_error(
        _request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        return _error_response(
            status_code=exc.status_code,
            error_code=ErrorCode.HTTP_ERROR,
            message="The request could not be completed.",
            headers=exc.headers,
        )

    @application.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "request_failed method=%s path=%s status=500 error=%s",
            request.method,
            request.url.path,
            exc,
        )
        response = _error_response(
            status_code=500,
            error_code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected server error occurred.",
        )
        response.headers[REQUEST_ID_HEADER] = current_request_id()
        return response


app = create_app()
