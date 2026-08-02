# Market Service

Spring Boot service for read-only property market analysis and what-if price
comparisons.

## Responsibilities

- Filter, sort, and page the fixed property dataset.
- Calculate aggregate market statistics and chart data.
- Export filtered properties as CSV.
- Run what-if scenarios through Prediction Service.
- Provide metadata used by the Market Portal.
- Report application and dataset health.

## Structure

```text
src/main/java/com/housinginsights/market/
├── api/             # REST controllers and API schemas
├── application/     # Analysis, query, caching, and what-if workflows
├── config/          # Application configuration
├── data/            # Housing dataset loading and validation
├── domain/          # Market models and business rules
├── error/           # API errors and exception handling
├── export/          # CSV export generation
├── metadata/        # Shared property metadata loading
├── observability/   # Request correlation and logging
├── prediction/      # Prediction Service client
└── MarketServiceApplication.java # Spring Boot application entry point
```

## API

- `GET /api/analysis` — retrieve filtered aggregate analysis and chart data.
- `GET /api/properties` — retrieve filtered, sorted, pageable properties.
- `POST /api/what-if` — compare baseline and modified property predictions.
- `GET /api/metadata` — retrieve Market constraints and available filters.
- `GET /api/properties/export/csv` — export all matching properties.
- `GET /api/health` — verify the application and local dataset are ready.

The complete request fields, response fields, filters, sorting, pagination,
validation rules, and error responses are available in Swagger UI at
<http://localhost:9002/docs>.

## Notes

- The dataset and property metadata are loaded into immutable memory. Missing,
  unreadable, empty, or invalid input prevents application startup.
- Prediction Service is required only for what-if requests. Its availability does
  not affect startup, market analysis, property browsing, CSV export, or health
  checks.
- Caffeine caches immutable filtered result sets for analysis, pagination, and CSV
  export. What-if results and failures are not cached.
- PDF export belongs to Insights Portal; Market Service supplies the analysis data
  but does not expose a PDF endpoint.
- API responses use `snake_case` JSON and support `X-Request-ID` correlation.

## Configuration

Defaults assume commands run from `market-service/`:

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `MARKET_DATASET_PATH` | `../data/House Price Dataset.csv` | Fixed read-only dataset |
| `PROPERTY_METADATA_PATH` | `../contracts/property-metadata.json` | Shared property metadata |
| `PREDICTION_SERVICE_URL` | `http://localhost:9000` | Prediction API base URL |
| `PREDICTION_SERVICE_TIMEOUT_SECONDS` | `5` | Prediction request timeout |
| `SERVER_PORT` | `9002` | HTTP port |

Configuration and metadata changes require a service restart.

## Start

Run from the repository root:

```bash
docker compose up --build market-service
```

Docker Compose also starts Prediction Service. The API is available at
<http://localhost:9002> and Swagger UI is available at
<http://localhost:9002/docs>.

## Testing

Prerequisite: JDK 21. The Maven Wrapper downloads Maven when first used.

Run from `market-service/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```
