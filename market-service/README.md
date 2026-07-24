# Market Service

Spring Boot backend for read-only property market analysis. It loads the supplied
housing CSV once at startup, serves filtered aggregate analysis and property records,
exports CSV/PDF reports, and calls `prediction-service` only for what-if analysis.

## Design

- `api` owns HTTP contracts and validation.
- `domain` owns filters, sorting, statistics, paging, caching, and what-if rules.
- `data` loads and validates the fixed read-only CSV.
- `prediction` is the external prediction-service boundary.
- `export` creates CSV and PDF output from shared query/analysis results.
- `config` wires validated configuration, HTTP, and cache support.
- `support.error` and `support.observability` own safe errors, logging, and request
  correlation.

The dataset is loaded into an immutable in-memory list. Missing, unreadable, empty, or
invalid data prevents startup. Prediction-service availability is deliberately not
checked at startup or by `/health`.

## Local development

Prerequisites: JDK 21. The Maven Wrapper downloads Maven when first used.

Run commands from `market-service/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
.\mvnw.cmd spring-boot:run
```

The API is available at <http://localhost:9002>. Swagger UI is at
<http://localhost:9002/docs>.

Defaults assume commands run from this directory:

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `MARKET_DATASET_PATH` | `../data/House Price Dataset.csv` | Fixed read-only dataset |
| `PREDICTION_SERVICE_URL` | `http://localhost:9000` | Prediction API base URL |
| `PREDICTION_SERVICE_TIMEOUT_SECONDS` | `5` | Connect and response timeout |

Spring Boot's standard `SERVER_PORT` can override port 9002.

## API

All JSON uses `snake_case`.

### Analysis

```http
GET /analysis?bedrooms=3&min_price=200000&max_price=300000
```

Returns the matching count, minimum/maximum/average/median price, price distribution,
average price grouped by bedrooms/build decade/square-footage band, and full-dataset
filter options. Every visualisation group includes a sample count. Empty filters
return all records; an empty result returns null price statistics and empty chart
arrays.

Shared filters are inclusive:

- `min_square_footage`, `max_square_footage`
- repeatable `bedrooms` and `bathrooms`
- `min_year_built`, `max_year_built`
- `min_lot_size`, `max_lot_size`
- `min_distance_to_city_center`, `max_distance_to_city_center`
- `min_school_rating`, `max_school_rating`
- `min_price`, `max_price`

### Property records

```http
GET /properties?bedrooms=3&sort_by=price&sort_direction=desc&limit=20&offset=0
```

The sort whitelist is `id`, `square_footage`, `bedrooms`, `bathrooms`,
`year_built`, `lot_size`, `distance_to_city_center`, `school_rating`, and `price`.
The default `limit` is 20, the maximum is 100, and the default `offset` is 0.

### What-if

```http
POST /what-if
Content-Type: application/json

{
  "baseline": {
    "square_footage": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1998,
    "lot_size": 7500,
    "distance_to_city_center": 5.6,
    "school_rating": 8.2
  },
  "scenarios": [
    {
      "square_footage": 2100,
      "bedrooms": 4,
      "bathrooms": 2.5,
      "year_built": 2005,
      "lot_size": 9200,
      "distance_to_city_center": 7.3,
      "school_rating": 8.5
    }
  ]
}
```

Baseline and scenarios are sent in one ordered `/predict` batch. The response includes
the baseline prediction and signed absolute/percentage differences for every scenario.
What-if data and downstream predictions are not persisted.

### Exports and health

- `GET /exports/properties.csv` accepts the shared filters plus sorting and exports all
  matching records, regardless of table pagination.
- `GET /exports/market-analysis.pdf` accepts the shared filters and exports the same
  aggregate analysis and four visualisations returned by `/analysis`.
- `GET /health` returns exactly `{"status":"ok"}` when the application and local
  dataset are ready.

## Request correlation and errors

Every request supports an optional `X-Request-ID` for request correlation. The
active identifier is returned in the response and propagated to
prediction-service.

Errors always use:

```json
{
  "error_code": "validation_error",
  "message": "Request validation failed."
}
```

Logs contain the request ID, method, path, and response status. Request bodies,
filters, housing records, and prediction values are not logged.

## Caching

Spring Cache with Caffeine caches successful aggregate analysis results by canonical
filter value. The cache is bounded to 256 entries and expires entries 30 minutes after
last access. PDF generation reuses the cached analysis, but PDF and CSV bytes are not
cached.

## Main libraries

- Apache Commons CSV: CSV loading and export
- Apache Commons IO: safe UTF-8 BOM handling for the fixed dataset
- Apache Commons Statistics: mean and median calculations
- Spring Cache with Caffeine: bounded in-memory analysis cache
- Spring RestClient: synchronous prediction-service integration
- Apache PDFBox: PDF creation
- XChart: chart rendering
- Jackson and Jakarta Validation: JSON and input validation
- springdoc-openapi: Swagger UI and OpenAPI

## Docker Compose

From the repository root:

```bash
docker compose up --build market-service
```

This also starts prediction-service because of the Compose dependency. Market analysis
and health remain independent if prediction-service later becomes unavailable; only
what-if requests fail in that case.
