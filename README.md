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

## Notes

1. For this task, all backends load the same
   `contracts/property-metadata.json` file to keep feature constraints consistent.
   In a multi-region production deployment, this file could be replaced by a
   versioned online configuration service. Each regional deployment would retrieve
   only the configuration applicable to its region, avoiding complex
   multi-region branching inside individual services while keeping frontend and
   backend constraints consistent.

2. Both `estimator-service` and `market-service` expose their own metadata API. This
   avoids unnecessary availability coupling: if only one service owned the metadata
   API, an outage in that service would also make the other Portal application
   unusable because its feature constraints would be unavailable. Keeping metadata
   at both application boundaries allows Estimator and Market features to operate
   independently.

3. Distributed request correlation uses `X-Request-ID`. The entry service and its
   downstream services reuse the same identifier and include it in structured logs.
   This makes it possible to reconstruct the request path across the service chain
   and quickly identify the failing service and related error information. The
   active identifier is returned in API responses, and public API errors use a
   consistent `error_code` and `message` response shape.

4. `packages/python/housing-common` is a shared Python package used by
   `prediction-service` and `estimator-service`. It centralizes property metadata
   models and loading, logging configuration, and request observability middleware.
   Keeping these cross-cutting concerns in one tested package avoids duplicated
   implementations and keeps behavior consistent between the two Python services.

## Start Housing Insights Platform

Docker Compose reads environment overrides from a `.env` file in the repository
root. Copy the provided example and adjust the PostgreSQL credentials or public
backend URLs when needed:

```bash
cp .env.example .env
```

Build and start the complete platform from the repository root:

```bash
docker compose up --build
```

Open the Portal at <http://localhost:9100>. Backend Swagger documentation is
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

Spring Boot service that provides market aggregates, property records, what-if
analysis, and CSV exports.

See [market-service/README.md](market-service/README.md) for configuration, API
endpoints, startup, and testing.
