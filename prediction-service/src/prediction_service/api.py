from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

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


def configure_logging() -> None:
    configured = os.getenv(LOG_LEVEL_ENV, "INFO").upper()
    level = getattr(logging, configured, logging.INFO)
    if not isinstance(level, int):
        level = logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger("prediction_service").setLevel(level)


def create_app(
    *,
    artifact_path: str | None = None,
    prediction_service: PredictionService | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        configure_logging()
        service = prediction_service
        if service is None:
            selected_artifact_path = Path(artifact_path or DEFAULT_ARTIFACT_PATH)
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


artifact_path_from_env = os.getenv(MODEL_ARTIFACT_ENV)
app = create_app(artifact_path=artifact_path_from_env)
