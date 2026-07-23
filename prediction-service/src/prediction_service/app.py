from __future__ import annotations

import logging
from collections.abc import Mapping
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from prediction_service.api import router
from prediction_service.artifact import (
    ArtifactError,
    load_artifact,
)
from prediction_service.constants import (
    MODEL_ARTIFACT_PATH,
    REQUEST_ID_HEADER,
)
from prediction_service.observability import (
    configure_logging,
    correlate_request,
    request_id_from_request,
)
from prediction_service.prediction import PredictionService, SklearnPredictionService
from prediction_service.schemas import ErrorResponse

LOGGER = logging.getLogger(__name__)


def _error_response(
    request: Request,
    status_code: int,
    error_code: str,
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


def create_app(
    artifact_path: str | None = None,
    prediction_service: PredictionService | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        configure_logging()
        service = prediction_service
        if service is None:
            selected_artifact_path = Path(artifact_path or MODEL_ARTIFACT_PATH)
            try:
                service = SklearnPredictionService(
                    load_artifact(selected_artifact_path)
                )
            except ArtifactError as exc:
                # Uvicorn records the propagated traceback once during startup.
                LOGGER.error(
                    "model_load_failed artifact=%s error=%s",
                    selected_artifact_path,
                    exc,
                )
                raise RuntimeError(
                    f"could not start without model: {selected_artifact_path}"
                ) from exc

            LOGGER.info("model_loaded artifact=%s", selected_artifact_path)

        application.state.prediction_service = service
        yield

    application = FastAPI(
        title="Housing Insights Prediction Service",
        description="Predict house prices with a trained linear regression model.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.include_router(router)
    application.middleware("http")(correlate_request)

    @application.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request,
        _exc: RequestValidationError,
    ) -> JSONResponse:
        return _error_response(
            request,
            status_code=422,
            error_code="validation_error",
            message="Request validation failed.",
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_error(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        return _error_response(
            request,
            status_code=exc.status_code,
            error_code="http_error",
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
            error_code="internal_error",
            message="An unexpected server error occurred.",
        )

    return application


app = create_app()
