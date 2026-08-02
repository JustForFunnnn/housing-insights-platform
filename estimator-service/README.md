# Estimator Service

FastAPI service that requests housing price predictions and stores estimate
history in PostgreSQL.

## Responsibilities

- Validate estimate requests using the shared property metadata.
- Request batch predictions from Prediction Service.
- Persist each estimate batch atomically.
- Provide paginated estimate history.
- Expose property metadata for client-side forms.
- Report service and database health.

## Structure

```text
src/estimator_service/
├── __init__.py           # Python package marker
├── api.py                # FastAPI routes and dependency access
├── app.py                # Application assembly, lifecycle, middleware, and errors
├── constants.py          # Pagination and API constants
├── data_access.py        # PostgreSQL connection and estimate persistence
├── errors.py             # Service-specific exceptions and public error codes
├── estimator.py          # Prediction and persistence workflow
├── domain.py             # Framework-independent domain models
├── prediction_client.py  # Prediction Service HTTP client
├── property_metadata.py  # Shared property metadata loading
├── schemas.py            # HTTP validation and response models
├── settings.py           # Environment-backed configuration
└── tables.py             # SQLAlchemy table definitions
```

## API

- `POST /api/estimates` — create and persist one or more property estimates.
- `GET /api/estimates` — retrieve paginated estimate history.
- `GET /api/metadata` — retrieve property constraints and display metadata.
- `GET /api/health` — verify PostgreSQL connectivity.

The complete request fields, response fields, validation rules, pagination
parameters, and error responses are available in Swagger UI at
<http://localhost:9001/docs>.

## Notes

- Estimator Service depends on Prediction Service and PostgreSQL.
- Estimate batches are persisted atomically.
- At startup, SQLAlchemy creates missing database objects but does not migrate
  existing objects.
- PostgreSQL data is stored in the `estimator-database-data` Docker volume.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PREDICTION_SERVICE_URL` | `http://localhost:9000` | Prediction API base URL |
| `PREDICTION_SERVICE_TIMEOUT_SECONDS` | `5` | Prediction request timeout |
| `ESTIMATOR_DATABASE_URL` | `postgresql+asyncpg://estimator:estimator@localhost:15432/estimator` | PostgreSQL connection |
| `PROPERTY_METADATA_PATH` | `../contracts/property-metadata.json` | Shared property metadata |

Configuration and metadata changes require a service restart.

## Start

Run from the repository root:

```bash
docker compose up --build estimator-service
```

The API is available at <http://localhost:9001> and Swagger UI is available at
<http://localhost:9001/docs>.

## Testing

Prerequisite: Python 3.12 and uv.

Run the default test suite from `estimator-service/`:

```bash
uv sync --extra dev
uv run pytest
```

PostgreSQL integration tests require a disposable database whose name contains
`test`. Set `ESTIMATOR_TEST_DATABASE_URL`, then run:

```bash
uv run pytest -m integration
```
