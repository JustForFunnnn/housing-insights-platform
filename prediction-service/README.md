# Prediction Service

FastAPI service for training and serving a Scikit-learn linear regression model.

## Design

The modules follow the service's actual boundaries:

- `models.py` contains the feature contract and framework-free result types.
- `artifact.py` owns model persistence and compatibility checks.
- `prediction.py` defines the prediction port and its Scikit-learn implementation.
- `schemas.py` contains independent HTTP request, response, and CSV contracts that
  share only the housing feature constraints.
- `training.py` handles CSV ingestion, cross-validation, and fitting.
- `routes.py` translates between HTTP schemas and the prediction port.
- `api.py` wires the implementation to FastAPI and owns application-level errors.

External requests are strict, CSV rows allow numeric string coercion, and response
shapes can evolve without changing either input contract. The prediction service
receives framework-independent `HousingFeatures` objects rather than Pydantic models.

The artifact is loaded once per process. A missing or incompatible artifact stops the
application at startup instead of allowing a healthy-looking but unusable service.

## Local development

Run commands from `prediction-service/`:

```bash
uv sync --extra dev
uv run housing-train "../data/House Price Dataset.csv"
uv run pytest
uv run uvicorn prediction_service.api:app --reload
```

Swagger UI is available at <http://localhost:8000/docs>.

To load an artifact from another location, set `MODEL_ARTIFACT_PATH` before
starting Uvicorn. Its default is `artifacts/model_pipeline.joblib`.

Application logging defaults to `INFO`. Each request log includes the endpoint,
response status, complete request parameters, and duration in milliseconds.

## API

`POST /predict` always accepts a list of 1 to 100 property records. A single
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

`GET /model-info` returns the training timestamp, feature coefficients, intercept,
and five-fold R², RMSE, and MAE mean/standard-deviation summaries. `GET /health`
returns `{"status":"ok"}`.

## Docker

Run from the repository root. The image trains the model during the build, so it
is self-contained at runtime:

```bash
docker compose up --build prediction-service
```
