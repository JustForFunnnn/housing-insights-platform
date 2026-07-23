# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.30 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_ARTIFACT_PATH=/app/artifacts/model_pipeline.joblib \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

COPY prediction-service/pyproject.toml prediction-service/uv.lock ./
COPY prediction-service/src/ src/
RUN --mount=type=cache,target=/root/.cache/uv,sharing=locked \
    uv sync --locked --no-dev --no-editable

COPY ["data/House Price Dataset.csv", "data/House Price Dataset.csv"]
RUN .venv/bin/python -m prediction_service.training \
    "data/House Price Dataset.csv" \
    --output "artifacts/model_pipeline.joblib"

EXPOSE 9000

CMD ["/app/.venv/bin/uvicorn", "prediction_service.app:app", "--host", "0.0.0.0", "--port", "9000", "--log-level", "info"]
