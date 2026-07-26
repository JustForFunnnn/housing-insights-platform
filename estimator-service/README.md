# Estimator Service

FastAPI backend that requests housing-price predictions and persists estimate history
in PostgreSQL.

## Design

The service follows the same application structure as `prediction-service`:

- `app.py` assembles the application, lifecycle, and exception handlers.
- `api.py` owns the public HTTP endpoints.
- `schemas.py` defines the strict public and downstream contracts.
- `prediction_client.py` integrates with the prediction service.
- `estimator.py` coordinates predictions and atomic persistence.
- `data_access.py` owns SQLAlchemy ORM initialization, transactions, and queries.
- `tables.py` is the single source for table, constraint, and index metadata.
- `settings.py` validates environment-backed configuration.
- `errors.py` contains public error codes and service-specific exception types.
- `property_metadata.py` loads the shared field metadata.
- `observability.py` owns request correlation and request logging.

Estimate history is global and batch inserts are atomic.
Property metadata is validated and loaded once at startup. Set
`PROPERTY_METADATA_PATH` to override the repository contract. Restart the service
after changing the file.

## Local development

Start `estimator-database` from the repository root before running the service
locally.

Run commands from `estimator-service/`:

```bash
uv sync --extra dev
uv run pytest
uv run uvicorn estimator_service.app:app --reload --port 9001
```

The prediction service defaults to <http://localhost:9000>. Swagger UI is available
at <http://localhost:9001/docs>.

The PostgreSQL container creates the configured database. At application startup,
SQLAlchemy creates objects missing from the ORM metadata. It does not alter existing
objects, so later schema changes require a migration.

## API

Every request supports an optional `X-Request-ID` for request correlation. The
active identifier is returned in the response and propagated to the prediction
service.

### Create estimates

`POST /api/estimates` accepts 1 to 20 properties:

```json
{
  "properties": [
    {
      "square_footage": 1850,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1998,
      "lot_size": 7500,
      "distance_to_city_center": 5.6,
      "school_rating": 8.2
    }
  ]
}
```

Use `GET /api/metadata` for the current form constraints and units.

### Query history

- `GET /api/estimates?limit=20&offset=0` returns newest records first and includes the
  total record count.
- `GET /api/metadata` returns `{"features": {...}}` for form
  generation and client-side validation, plus `"price_currency": "USD"`
  for price formatting. Feature `min`, `max`, and `unit` values come from the
  shared property metadata contract.

An offset at or beyond the total returns `200` with an empty list.

### Health

`GET /api/health` verifies that PostgreSQL is reachable and queryable. It does not call
the prediction service, so a prediction-service outage does not make this endpoint
fail.

## Docker

From the repository root:

```bash
docker compose up --build estimator-service
```

The estimator is available at <http://localhost:9001>. PostgreSQL data is stored in
a named Docker volume.
