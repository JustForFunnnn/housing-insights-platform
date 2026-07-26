# Market Service

Spring Boot backend for read-only property market analysis. It loads the supplied
housing CSV at startup and calls `prediction-service` only for what-if analysis.

## Responsibilities

- Filter, sort, and page the fixed property dataset.
- Calculate aggregate market statistics and chart data.
- Export filtered property records as CSV.
- Run what-if scenarios through `prediction-service`.
- Provide metadata used by the Market Portal.

The dataset and property metadata are loaded into immutable memory. Missing,
unreadable, empty, or invalid input prevents startup. Prediction availability does
not affect startup, market analysis, property browsing, export, or health checks.

## Structure

- `api` and `api.schema` define the HTTP boundary.
- `application` coordinates queries, analysis, caching, and what-if use cases.
- `domain` owns market models and rules.
- `data` and `metadata` load and validate repository data.
- `prediction` owns the prediction-service boundary.
- `export` produces CSV output.
- `config`, `error`, and `observability` provide application infrastructure.

## Local development

Prerequisite: JDK 21. The Maven Wrapper downloads Maven when first used.

Run commands from `market-service/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
.\mvnw.cmd spring-boot:run
```

The API is available at <http://localhost:9002>. Use Swagger UI at
<http://localhost:9002/docs> for filters, sorting, pagination, request fields,
response fields, validation rules, and error responses.

## Configuration

Defaults assume commands run from `market-service/`:

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `MARKET_DATASET_PATH` | `../data/House Price Dataset.csv` | Fixed read-only dataset |
| `PROPERTY_METADATA_PATH` | `../contracts/property-metadata.json` | Shared property metadata |
| `PREDICTION_SERVICE_URL` | `http://localhost:9000` | Prediction API base URL |
| `PREDICTION_SERVICE_TIMEOUT_SECONDS` | `5` | Prediction request timeout |
| `SERVER_PORT` | `9002` | HTTP port |

Configuration and metadata changes require a restart.

## API

- `GET /api/analysis` — retrieve filtered aggregate analysis and chart data.
- `GET /api/properties` — retrieve filtered, sorted, pageable property records.
- `POST /api/what-if` — compare baseline and modified property predictions.
- `GET /api/metadata` — retrieve Market constraints and filter options.
- `GET /api/properties/export/csv` — export all matching property records.
- `GET /api/health` — verify the application and local dataset are ready.

All JSON uses `snake_case`. Every endpoint supports `X-Request-ID` correlation. See
<http://localhost:9002/docs> for the complete API contract.

PDF export belongs to `insights-portal`; Market supplies the analysis data but does
not expose a PDF endpoint.

## Caching

Caffeine caches immutable filtered result sets so analysis, property pagination, and
CSV export can reuse the same filtering work. What-if results, failures, and rendered
output are not cached.

## Docker

Run from the repository root:

```bash
docker compose up --build market-service
```

Compose also starts `prediction-service`. If Prediction later becomes unavailable,
only what-if requests are affected.
