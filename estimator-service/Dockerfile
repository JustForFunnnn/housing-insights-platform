# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.30 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PREDICTION_SERVICE_URL=http://prediction-service:9000 \
    PREDICTION_SERVICE_TIMEOUT_SECONDS=5 \
    ESTIMATOR_DATABASE_URL=postgresql+asyncpg://estimator:estimator@estimator-database:5432/estimator \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

COPY pyproject.toml uv.lock ./
COPY src/ src/
RUN --mount=type=cache,target=/root/.cache/uv,sharing=locked \
    uv sync --locked --no-dev --no-editable

EXPOSE 9001

CMD ["/app/.venv/bin/uvicorn", "estimator_service.app:app", "--host", "0.0.0.0", "--port", "9001", "--log-level", "info"]
