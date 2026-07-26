# Prediction Service

FastAPI service that trains a Scikit-learn housing price model and serves batch
predictions from the generated model artifact.

## Responsibilities

- Read and validate the training CSV.
- Train and evaluate a log-target linear regression model.
- Persist and load the model artifact.
- Serve predictions, model information, and health status.

## Structure

```text
src/prediction_service/
├── __init__.py           # Python package marker
├── api.py                # FastAPI routes and dependency access
├── app.py                # Application assembly, middleware, and errors
├── artifact.py           # Model artifact persistence and validation
├── constants.py          # Training, feature, and API constants
├── errors.py             # Public error codes and service exceptions
├── models.py             # Framework-independent domain models
├── prediction.py         # Prediction service implementation
├── property_metadata.py  # Shared property metadata loading
├── schemas.py            # HTTP and training-row validation models
├── settings.py           # Environment-backed configuration
└── training.py           # CSV loading, evaluation, and model training
```

## API

- `POST /api/predict` — generate price predictions for a property batch.
- `GET /api/model-info` — inspect the loaded model and its training metrics.
- `GET /api/health` — verify that the service started successfully.

The complete request fields, response fields, validation rules, and error responses
are available in Swagger UI at <http://localhost:9000/docs>.

## Notes

- The training target uses a natural-log transformation. Model coefficients and the
  intercept therefore operate in log-price space.
- The Docker image trains the model during the build and includes the generated
  artifact at runtime.
- A missing or incompatible model artifact prevents application startup.
- API requests support `X-Request-ID` correlation.

To train the model locally, run from `prediction-service/`:

```bash
uv sync
uv run housing-train "../data/House Price Dataset.csv"
```

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `MODEL_ARTIFACT_PATH` | `artifacts/model_pipeline.joblib` | Trained model artifact |
| `PROPERTY_METADATA_PATH` | `../contracts/property-metadata.json` | Shared feature metadata |

Configuration and metadata changes require a service restart.

## Start

Run from the repository root:

```bash
docker compose up --build prediction-service
```

The API is available at <http://localhost:9000> and Swagger UI is available at
<http://localhost:9000/docs>.

## Testing

Prerequisite: Python 3.12 and uv.

Run from `prediction-service/`:

```bash
uv sync --extra dev
uv run pytest
```

The test suite covers API behavior, validation, model artifacts, prediction,
configuration, CSV ingestion, and training.
