# Housing Insights Platform

A containerized housing analytics platform that combines machine-learning price
prediction, persisted property estimates, market analysis, and a Next.js web
portal.

## Repository layout

- `data/` — shared housing datasets used for model training and market analysis.
- `contracts/` — version-controlled property metadata shared by the backends.
- `packages/python/housing-common/` — shared Python metadata and observability utilities.
- `prediction-service/` — FastAPI and Scikit-learn housing price prediction service.
- `estimator-service/` — FastAPI service for creating and storing property estimates.
- `market-service/` — Spring Boot service for housing market analysis and what-if scenarios.
- `insights-portal/` — Next.js frontend for the Estimator and Market applications.

## Architecture

```text
Insights Portal ──> Estimator Service ───────────> Prediction Service
                           │                                ↑
                           └──> PostgreSQL                  │
                                                            │
Insights Portal ──> Market Service ─────────────────────────┘
```

## Notes

1. All backends load `contracts/property-metadata.json` to keep feature constraints
   consistent. It is the single source of truth for property feature constraints in
   this project. In a production system, it could be replaced by an online
   configuration service or API that provides region-specific settings.

2. Estimator and Market each expose their own metadata API, avoiding a runtime
   dependency between them. If one service is unavailable, the other area of the
   Portal can continue to operate with its own constraints.

3. Each backend accepts or generates an `X-Request-ID`, then returns and logs it.
   Estimator and Market forward the same ID to Prediction, making each service call
   chain traceable and helping locate failures quickly. The Portal logs returned IDs
   for non-success responses, and public API errors share a consistent `error_code`
   and `message` shape.

4. `packages/python/housing-common` centralizes metadata and observability utilities
   for Prediction and Estimator. This avoids duplication and keeps both Python
   services consistent.

## Start Housing Insights Platform

Docker and Docker Compose v2 are required.

The platform can run with the defaults in `docker-compose.yml`. To override the
PostgreSQL credentials or public backend URLs, copy the optional `.env.example`
file to `.env` in the repository root and adjust its values:

```bash
cp .env.example .env
```

`NEXT_PUBLIC_*` values are included in the Portal browser bundle at build time,
so the Portal must be rebuilt after they change.

Build and start the complete platform from the repository root:

```bash
docker compose up --build
```

Open the Portal at <http://localhost:9010>. Backend Swagger documentation is
available at:

- Prediction Service: <http://localhost:9000/docs>
- Estimator Service: <http://localhost:9001/docs>
- Market Service: <http://localhost:9002/docs>

## Services

### Insights Portal

Next.js frontend for property estimation, comparison, history, market dashboards,
what-if analysis, and report exports.

See [insights-portal/README.md](insights-portal/README.md) for configuration, routes,
startup, and testing.

### Prediction Service

FastAPI service that trains and serves the Scikit-learn housing price model.

See [prediction-service/README.md](prediction-service/README.md) for configuration,
API endpoints, startup, and testing.

### Estimator Service

FastAPI service that requests price predictions and stores estimate history in
PostgreSQL.

See [estimator-service/README.md](estimator-service/README.md) for configuration,
API endpoints, startup, and testing.

### Market Service

Spring Boot service that provides market aggregates, properties, what-if
analysis, and CSV exports.

See [market-service/README.md](market-service/README.md) for configuration, API
endpoints, startup, and testing.
