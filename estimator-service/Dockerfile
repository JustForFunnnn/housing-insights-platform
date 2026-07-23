# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.30 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PREDICTION_SERVICE_URL=http://prediction-service:8000 \
    PREDICTION_SERVICE_TIMEOUT_SECONDS=5 \
    ESTIMATOR_DATABASE_PATH=/app/data/estimator.db \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

COPY pyproject.toml uv.lock ./
COPY src/ src/
RUN --mount=type=cache,target=/root/.cache/uv,sharing=locked \
    uv sync --locked --no-dev --no-editable && \
    mkdir -p /app/data

EXPOSE 8100

CMD ["/app/.venv/bin/uvicorn", "estimator_service.app:app", "--host", "0.0.0.0", "--port", "8100", "--log-level", "info"]
