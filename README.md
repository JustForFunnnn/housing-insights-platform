# Housing Insights Platform

A monorepo for the housing model API and the applications that consume it.

## Repository layout

- `data/` — shared training and prediction CSV files
- `prediction-service/` — scikit-learn housing price prediction API
- `estimator-service/` — property value estimator backend
- `market-service/` — property market analysis backend
- `insights-portal/` — shared web portal

## Prediction service

For local Python development, run commands from `prediction-service/`. The training
dataset is available at `../data/House Price Dataset.csv` from that directory.
See [prediction-service/README.md](prediction-service/README.md) for setup, testing, API,
and training instructions.

Build and start the prediction service from the repository root:

```bash
docker compose up --build prediction-service
```

The API is then available at <http://localhost:8000>, with Swagger UI at
<http://localhost:8000/docs>.
