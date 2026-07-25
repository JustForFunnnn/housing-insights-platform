# Market Service

Spring Boot backend for read-only property market analysis. It loads the supplied
housing CSV once at startup, serves filtered aggregate analysis and property records,
exports filtered CSV records, and calls `prediction-service` only for what-if analysis.
The Next.js portal renders PDF from the analysis response and the same frontend charts
shown on screen.

## Design

- `api` owns HTTP endpoints; `api.schema` owns request and response contracts.
- `application` owns querying, analysis orchestration, filtered-result caching, and what-if use cases.
- `domain` owns property, filtering, sorting, paging, analysis, and what-if models and rules.
- `data` loads and validates the fixed read-only CSV.
- `prediction` is the external prediction-service boundary.
- `export` serializes filtered property records as CSV.
- `metadata` loads the shared property field contract and validates dataset,
  filters, and what-if features.
- `config` wires validated configuration, HTTP, and cache support.
- `error` owns custom exceptions and exception mapping.
- `observability` owns logging and request correlation.

The dataset and property metadata are loaded once into immutable memory. Missing,
unreadable, empty, or invalid data prevents startup. Prediction-service availability
is deliberately not checked at startup or by `/api/health`.

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
| `PROPERTY_METADATA_PATH` | `../contracts/property-field-metadata.json` | Shared field contract |
| `PREDICTION_SERVICE_URL` | `http://localhost:9000` | Prediction API base URL |
| `PREDICTION_SERVICE_TIMEOUT_SECONDS` | `5` | Connect and response timeout |

Spring Boot's standard `SERVER_PORT` can override port 9002.
Metadata changes take effect after restarting the service; the file is not polled
while the process is running.

## API

All JSON uses `snake_case`.

### Analysis

```http
GET /api/analysis?bedrooms=3&min_price=200000&max_price=300000
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
GET /api/properties?bedrooms=3&sort_by=price&sort_direction=desc&limit=20&offset=0
```

The sort whitelist is `id`, `square_footage`, `bedrooms`, `bathrooms`,
`year_built`, `lot_size`, `distance_to_city_center`, `school_rating`, and `price`.
The default `limit` is 20, the maximum is 100, and the default `offset` is 0.

### What-if

```http
POST /api/what-if
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

Baseline and scenarios are sent in one ordered `/api/predict` batch. The response includes
the baseline prediction and signed absolute/percentage differences for every scenario.
What-if data and downstream predictions are not persisted.

### Metadata, export, and health

- `GET /api/metadata` returns the shared property fields plus
  `filter_options` calculated from the complete CSV. Price range and actual
  bedroom/bathroom options therefore remain dataset-derived.
- `GET /api/properties/export/csv` accepts the shared filters plus sorting and exports all
  matching records, regardless of table pagination.
- PDF remains a portal requirement: Next.js calls
  `GET /api/analysis` and exports the corresponding aggregate analysis
  and the same visualisations rendered in the browser. Java has no PDF endpoint.
- `GET /api/health` returns exactly `{"status":"ok"}` when the application and local
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

Logs contain the request ID, method, path, and response status.

## Caching

Spring Cache with Caffeine caches the complete immutable matching-property list by
canonical `MarketFilter`. Properties pagination, aggregate analysis, and CSV sorting
all reuse that one filtering operation. The cache is bounded to 256 entries and
expires entries 30 minutes after last access. Analysis objects, pages, CSV bytes,
what-if results, and failures are not cached.

## Main libraries

- Apache Commons CSV: CSV loading and export
- Apache Commons IO: safe UTF-8 BOM handling for the fixed dataset
- Apache Commons Statistics: mean and median calculations
- Spring Cache with Caffeine: bounded in-memory filtered-result cache
- Spring RestClient: synchronous prediction-service integration
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
