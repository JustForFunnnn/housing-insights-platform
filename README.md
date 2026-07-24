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

The API is then available at <http://localhost:9000>, with Swagger UI at
<http://localhost:9000/docs>.

## Estimator service

The estimator calls the prediction service and stores estimate history in PostgreSQL.
Start its dependencies from the repository root:

```bash
docker compose up -d prediction-service estimator-database
```

For local Python development, run commands from `estimator-service/`:

```bash
uv sync --extra dev
uv run pytest
uv run uvicorn estimator_service.app:app --reload --port 9001
```

See [estimator-service/README.md](estimator-service/README.md) for its API and
local development.

Build and start both backend services from the repository root:

```bash
docker compose up --build estimator-service
```

The estimator API is available at <http://localhost:9001>, with Swagger UI at
<http://localhost:9001/docs>.

## Market service

The Java market backend loads the fixed housing dataset into read-only memory and
provides filtered aggregate analysis, visualisation data, pageable property records,
what-if predictions, and CSV/PDF exports.

For local development with JDK 21, run commands from `market-service/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
.\mvnw.cmd spring-boot:run
```

See [market-service/README.md](market-service/README.md) for configuration, API
examples, filters, exports, request correlation, and error contracts.

Build and start the market and prediction services from the repository root:

```bash
docker compose up --build market-service
```

The market API is available at <http://localhost:9002>, with Swagger UI at
<http://localhost:9002/docs>.
