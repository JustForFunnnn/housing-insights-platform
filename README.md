# Housing Insights Platform

A monorepo for the housing model API and the applications that consume it.

## Repository layout

- `data/` — shared training and prediction CSV files
- `contracts/` — shared property metadata loaded by all three backends
- `prediction-service/` — scikit-learn housing price prediction API
- `estimator-service/` — property value estimator backend
- `market-service/` — property market analysis backend
- `insights-portal/` — shared web portal

Docker Compose automatically reads an optional `.env` file from the repository root.
Copy `.env.example` to `.env` to override the PostgreSQL settings or the public
backend URLs compiled into the portal; without it, the defaults in
`docker-compose.yml` are used.

All three backend images include
`contracts/property-metadata.json`. Compose also mounts the repository copy
read-only at `/app/contracts/property-metadata.json`, so a normal
`docker compose up` starts with the current shared contract. Each service reads it
once at startup; restart the affected containers after changing it.
Feature metadata always includes finite `min` and `max` values. `year_built` uses
the configured bounds without a runtime override. The contract also includes the
top-level `price_currency` value used for price formatting.

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
what-if predictions, and CSV exports. The portal's PDF export uses the same analysis
response and price-distribution data as the dashboard, avoiding a second Java
chart-rendering stack.

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

## Insights portal

The Next.js portal provides a shared shell for the estimator and market
applications. It reads form constraints and display units from backend metadata,
keeps market filters in the URL, and generates market PDF reports from the same
analysis data used by the browser charts.

Start the complete interview environment from the repository root:

```bash
docker compose up --build
```

Open the portal at <http://localhost:9100>. Browser interactions call the
Estimator and Market services through their published ports. Server-rendered
pages and PDF generation use the Compose network.

For local portal development, copy `insights-portal/.env.example` to
`insights-portal/.env.local` and run the application on port 9100. The
`NEXT_PUBLIC_*` variables configure browser requests; the corresponding
server-only variables are used for initial rendering and PDF reports.

## Backend routes

- Prediction: `POST /api/predict`, `GET /api/model-info`,
  `GET /api/health`
- Estimator: `POST/GET /api/estimates`, `GET /api/metadata`,
  `GET /api/health`
- Market: `GET /api/metadata`, `GET /api/properties`,
  `GET /api/analysis`, `POST /api/what-if`,
  `GET /api/properties/export/csv`, `GET /api/health`
- Portal: `GET /api/health`
