# Prediction Service

FastAPI service for training and serving a Scikit-learn log-target linear regression
model.

## Design

The modules follow the service's actual boundaries:

- `constants.py` contains shared service constants.
- `settings.py` validates environment-backed configuration.
- `errors.py` contains public error codes and service-specific exception types.
- `models.py` contains the feature contract and framework-free result types.
- `artifact.py` owns model persistence and compatibility checks.
- `prediction.py` defines the prediction port and its Scikit-learn implementation.
- `schemas.py` contains independent HTTP request, response, and CSV contracts that
  preserve strict structural and finite-number validation.
- `property_metadata.py` loads the configured snapshot with the shared metadata model.
- `training.py` handles CSV ingestion, cross-validation, and fitting.
- `api.py` translates between HTTP schemas and the prediction port.
- `app.py` wires the implementation, shared observability, and application-level
  errors to FastAPI.

API requests use strict type validation, while CSV training rows allow numeric
strings to be converted to numbers.


## Local development

Run commands from `prediction-service/`:

```bash
uv sync --extra dev
uv run housing-train "../data/House Price Dataset.csv"
uv run pytest
uv run uvicorn prediction_service.app:app --reload --port 9000
```

Swagger UI is available at <http://localhost:9000/docs>.

To load an artifact from another location, set `MODEL_ARTIFACT_PATH` before
starting Uvicorn. Its default is `artifacts/model_pipeline.joblib`.

## API

Every request supports an optional `X-Request-ID` for request correlation. The
active identifier is included in application logs and returned in the response.

### Predict

`POST /api/predict` always accepts a list of 1 to 20 property records. A single
prediction is represented by a one-item list; bare objects are not accepted:

```json
{
  "instances": [
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

```json
{
  "predictions": [285479]
}
```

The numeric result depends on the trained artifact. Raw model outputs are rounded to
integer prices; OpenAPI exposes each prediction as an `int64` value.

### Housing Feature Inputs

The prediction, estimator, and market services load the same
`contracts/property-metadata.json` once at startup. Feature constraints and
units are intentionally not duplicated in this README. They are exposed to portal
clients by each application's `GET /api/metadata` endpoint.

Prediction requests are validated against the same metadata. Strict types, finite
numbers, batch size, extra-field rejection, and signed 64-bit result checks also
remain in effect. Configuration changes require a service restart.

### Model Information

`GET /api/model-info` returns the training timestamp, feature coefficients, intercept,
and five-fold R², RMSE, and MAE mean/standard-deviation summaries.

### Health Check

`GET /api/health` returns `{"status":"ok"}`. A missing or incompatible model artifact
prevents the application from starting.

### Error Responses

API errors use a consistent response shape. The correlation identifier is
returned in the `X-Request-ID` response header:

```json
{
  "error_code": "validation_error",
  "message": "Request validation failed."
}
```

Internal exception messages and tracebacks are logged server-side but are never
returned to clients.

## Docker

Run from the repository root. The image trains the model during the build, so it
is self-contained at runtime:

```bash
docker compose up --build prediction-service
```
