# Estimator Service

FastAPI backend that requests housing-price predictions and persists estimate history
in SQLite.

## Design

The service follows the same application structure as `prediction-service`:

- `app.py` assembles the application, lifecycle, and safe exception handlers.
- `api.py` owns the public HTTP endpoints.
- `schemas.py` defines the strict public and downstream contracts.
- `prediction_client.py` integrates with the prediction service.
- `estimator.py` coordinates predictions and atomic persistence.
- `data_access.py` owns SQLAlchemy ORM transactions and queries.
- `database/orm.py` is the single source for table, constraint, and index metadata.
- `database/initialize.py` explicitly creates missing metadata objects.
- `settings.py` validates environment-backed configuration.
- `observability.py` owns request correlation and safe request logging.

Estimate history is global. Batch inserts are atomic, each history page and its total
use one read transaction, and writes are serialized within the single service process.

## Local development

Run commands from `estimator-service/`:

```bash
uv sync --extra dev
uv run housing-estimator-init-db
uv run pytest
uv run uvicorn estimator_service.app:app --reload --port 9001
```

The prediction service defaults to <http://localhost:9000>. Swagger UI is available
at <http://localhost:9001/docs>.

Configuration:

- `PREDICTION_SERVICE_URL` defaults to `http://localhost:9000`.
- `PREDICTION_SERVICE_TIMEOUT_SECONDS` defaults to `5`.
- `ESTIMATOR_DATABASE_PATH` defaults to `data/estimator.db`.

The application does not create or migrate tables during startup. A maintainer
must run `uv run housing-estimator-init-db` before the first start. The command
creates missing database objects but does not alter an existing table; until a
migration mechanism is introduced, later schema changes must be applied
manually. Use `--database PATH` to initialize a path other than
`ESTIMATOR_DATABASE_PATH`. The Docker image runs the initialization command
before Uvicorn so a new volume is initialized automatically.

## API

Every request accepts an optional UUID4 `X-Request-ID`. A missing or invalid
identifier is replaced with a generated UUID4 value. The active identifier is
returned in the response and propagated unchanged to the prediction service
through request context; a valid supplied identifier is preserved unchanged.

### Create estimates

`POST /estimates` accepts 1 to 20 properties:

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

The `201` response contains the persisted records in request order, including each
record's identifier, input property, estimated price, and creation timestamp.

### Query history

- `GET /estimates?limit=20&offset=0` returns newest records first and includes the
  total record count.
- `GET /estimates/{estimate_id}` returns one persisted estimate.

An offset at or beyond the total returns `200` with an empty list.

### Health

`GET /health` verifies that SQLite is reachable and queryable. It does not call the
prediction service, so a prediction-service outage does not make this endpoint fail.

## Docker

From the repository root:

```bash
docker compose up --build estimator-service
```

The estimator is available at <http://localhost:9001>. Its SQLite file is stored in a
named Docker volume.
