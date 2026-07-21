from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from prediction_service.artifact import (
    DEFAULT_ARTIFACT_PATH,
    ArtifactError,
    load_artifact,
)
from prediction_service.prediction import PredictionService, SklearnPredictionService
from prediction_service.routes import router

LOGGER = logging.getLogger(__name__)
MODEL_ARTIFACT_ENV = "MODEL_ARTIFACT_PATH"
LOG_LEVEL_ENV = "LOG_LEVEL"


def configure_logging() -> int:
    configured = os.getenv(LOG_LEVEL_ENV, "INFO").upper()
    level = getattr(logging, configured, logging.INFO)
    if not isinstance(level, int):
        level = logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger("prediction_service").setLevel(level)
    return level


async def request_parameters(request: Request) -> dict[str, object]:
    parameters: dict[str, object] = {
        "path": dict(request.path_params),
        "query": list(request.query_params.multi_items()),
    }
    body = await request.body()
    if body:
        try:
            parameters["body"] = json.loads(body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            parameters["body"] = body.decode("utf-8", errors="replace")
    return parameters


def create_app(
    *,
    artifact_path: Path | None = None,
    prediction_service: PredictionService | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        configure_logging()
        service = prediction_service
        if service is None:
            configured_path = os.getenv(MODEL_ARTIFACT_ENV)
            selected_path = artifact_path or (
                Path(configured_path) if configured_path else DEFAULT_ARTIFACT_PATH
            )
            try:
                service = SklearnPredictionService(load_artifact(selected_path))
            except ArtifactError as exc:
                # Uvicorn records the propagated traceback once during startup.
                LOGGER.error(
                    "model_load_failed artifact=%s error=%s",
                    selected_path,
                    exc,
                )
                raise RuntimeError(
                    f"could not start without model: {selected_path}"
                ) from exc

            LOGGER.info("model_loaded artifact=%s", selected_path)

        application.state.prediction_service = service
        yield

    application = FastAPI(
        title="Housing Insights Prediction Service",
        description="Predict house prices with a trained linear regression model.",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.include_router(router)

    @application.middleware("http")
    async def log_request(request: Request, call_next):
        started = perf_counter()
        status = 500
        parameters = await request_parameters(request)
        try:
            response = await call_next(request)
            status = response.status_code
            return response
        finally:
            duration_ms = (perf_counter() - started) * 1000
            LOGGER.info(
                "request_complete endpoint=%s status=%d parameters=%s duration_ms=%.2f",
                request.url.path,
                status,
                json.dumps(parameters, ensure_ascii=False, default=str),
                duration_ms,
            )

    @application.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        del request
        return JSONResponse(
            status_code=422,
            content={
                "detail": [
                    {
                        "type": error["type"],
                        "loc": error["loc"],
                        "msg": error["msg"],
                    }
                    for error in exc.errors()
                ],
            },
        )

    @application.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        LOGGER.exception(
            "request_failed method=%s path=%s error=%s",
            request.method,
            request.url.path,
            exc,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred."},
        )

    return application


app = create_app()
