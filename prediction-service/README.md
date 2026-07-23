# Prediction Service

FastAPI service for training and serving a Scikit-learn linear regression model.

## Design

The modules follow the service's actual boundaries:

- `constants.py` contains shared service constants.
- `settings.py` validates environment-backed configuration.
- `errors.py` contains service-specific exception types.
- `models.py` contains the feature contract and framework-free result types.
- `artifact.py` owns model persistence and compatibility checks.
- `prediction.py` defines the prediction port and its Scikit-learn implementation.
- `schemas.py` contains independent HTTP request, response, and CSV contracts that
  share only the housing feature constraints.
- `training.py` handles CSV ingestion, cross-validation, and fitting.
- `api.py` translates between HTTP schemas and the prediction port.
- `observability.py` owns logging and request correlation.
- `app.py` wires the implementation to FastAPI and owns application-level errors.

API requests use strict type validation, while CSV training rows allow numeric
strings to be converted to numbers.

The artifact is loaded once per process. A missing or incompatible artifact stops the
application at startup instead of allowing a healthy-looking but unusable service.

## Local development

Run commands from `prediction-service/`:

```bash
uv sync --extra dev
uv run housing-train "../data/House Price Dataset.csv"
uv run pytest
uv run uvicorn prediction_service.app:app --reload
```

Swagger UI is available at <http://localhost:8000/docs>.

To load an artifact from another location, set `MODEL_ARTIFACT_PATH` before
starting Uvicorn. Its default is `artifacts/model_pipeline.joblib`.

## API

Each request may include a UUID4 `X-Request-ID` header for request correlation.
When the header is missing or invalid, the service generates a UUID4 identifier.
The active identifier is included in application logs and returned in the
response header; a valid supplied identifier is preserved unchanged.

### Predict

`POST /predict` always accepts a list of 1 to 20 property records. A single
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
  "predictions": [285479],
  "count": 1
}
```

The numeric result depends on the trained artifact. Raw model outputs are rounded to
integer prices; OpenAPI exposes each prediction as an `int64` value.

### Model Information

`GET /model-info` returns the training timestamp, feature coefficients, intercept,
and five-fold R², RMSE, and MAE mean/standard-deviation summaries.

### Health Check

`GET /health` returns `{"status":"ok"}`. A missing or incompatible model artifact
prevents the application from starting.

### Error Responses

API errors use a consistent and safe response shape. The correlation identifier is
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
