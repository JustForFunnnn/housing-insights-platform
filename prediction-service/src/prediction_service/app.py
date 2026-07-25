from __future__ import annotations

import logging
from collections.abc import Mapping
from contextlib import asynccontextmanager
from pathlib import Path

from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from prediction_service.api import router
from prediction_service.artifact import load_artifact
from prediction_service.constants import REQUEST_ID_HEADER
from prediction_service.errors import ArtifactError, ErrorCode
from prediction_service.observability import (
    configure_logging,
    current_request_id,
    log_request,
)
from prediction_service.prediction import PredictionService, SklearnPredictionService
from prediction_service.schemas import ErrorResponse
from prediction_service.settings import Settings

logger = logging.getLogger(__name__)


def create_app(
    artifact_path: str | None = None,
    prediction_service: PredictionService | None = None,
    app_settings: Settings | None = None,
) -> FastAPI:
    if app_settings is None:
        app_settings = Settings()
    if artifact_path is None:
        artifact_path = str(app_settings.model_artifact_path)

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        configure_logging()
        service = prediction_service
        if service is None:
            try:
                service = SklearnPredictionService(
                    load_artifact(Path(artifact_path))
                )
            except ArtifactError as exc:
                # Uvicorn records the propagated traceback once during startup.
                logger.error(
                    "model_load_failed artifact=%s error=%s",
                    artifact_path,
                    exc,
                )
                raise RuntimeError(
                    f"could not start without model: {artifact_path}"
                ) from exc

            logger.info("model_loaded artifact=%s", artifact_path)

        application.state.prediction_service = service
        yield

    application = FastAPI(
        title="Housing Insights Prediction Service",
        description="Predict house prices with a trained linear regression model.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.include_router(router)
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
        logger.info(
            "request_validation_failed method=%s path=%s error=%s",
            request.method,
            request.url.path,
            exc,
        )
        return _error_response(
            status_code=422,
            error_code=ErrorCode.VALIDATION_ERROR,
            message="Request validation failed.",
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
