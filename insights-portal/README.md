# Insights Portal

Next.js App Router frontend for exploring property estimates and housing market
insights.

## Responsibilities

- Provide property estimation, comparison, and history views.
- Provide market filters, charts, property tables, and what-if analysis.
- Load validation constraints and display metadata from backend services.
- Support server-rendered and browser-side backend requests.
- Generate downloadable Market CSV and PDF reports.
- Present responsive loading, empty, and error states.

## Structure

```text
src/
├── app/
│   ├── api/                 # Portal-owned Next.js Route Handlers
│   ├── estimator/           # Estimator pages and layouts
│   ├── market/              # Market pages and layouts
│   └── ...                  # Root layout, providers, and route states
├── api/                     # Browser/server API clients and shared types
├── components/              # Reusable navigation, form, chart, and UI components
├── features/
│   ├── estimator/           # Estimation, comparison, and history workflows
│   └── market/              # Dashboard, filtering, tables, and what-if workflows
├── lib/                     # Formatting, query, chart, and report helpers
├── server/                  # Server-only PDF rendering and route responses
└── test/                    # Shared Vitest and DOM test setup
```

## API

Application pages:

- `/` — view the platform overview.
- `/estimator` — create a property estimate.
- `/estimator/compare` — compare multiple properties.
- `/estimator/history` — browse saved estimate history.
- `/market` — explore market analysis and properties.
- `/market/what-if` — compare property scenarios.

Portal-owned endpoints:

- `GET /api/health` — report Portal health.
- `GET /api/reports/market` — generate a PDF for the selected Market segment.

The Portal does not duplicate backend request and response schemas. See the
backend Swagger documentation for complete API details:

- Estimator Service: <http://localhost:9001/docs>
- Market Service: <http://localhost:9002/docs>

## Notes

- The project uses the Next.js App Router with server and client components.
- Server-side requests use private service URLs, while browser requests use
  `NEXT_PUBLIC_*` URLs.
- Browser and server API clients log the backend `X-Request-ID` only when a
  backend returns a non-success response.
- The production image uses the Next.js standalone server output.

## Configuration

Copy `.env.example` to `.env.local` to override local backend URLs.

| Environment variable                | Default                 | Purpose                                 |
| ----------------------------------- | ----------------------- | --------------------------------------- |
| `ESTIMATOR_SERVICE_URL`             | `http://localhost:9001` | Server-side Estimator requests          |
| `MARKET_SERVICE_URL`                | `http://localhost:9002` | Server-side Market requests and reports |
| `NEXT_PUBLIC_ESTIMATOR_SERVICE_URL` | `http://localhost:9001` | Browser-side Estimator requests         |
| `NEXT_PUBLIC_MARKET_SERVICE_URL`    | `http://localhost:9002` | Browser-side Market requests            |

`NEXT_PUBLIC_*` values are included in the browser bundle at build time. Rebuild
the Portal after changing them.

## Start

Run from the repository root:

```bash
docker compose up --build insights-portal
```

Docker Compose starts the required backend services. Open
<http://localhost:9010> after the Portal health check passes.

## Testing

Prerequisite: Node.js 22 and npm.

Run the unit tests and static checks from `insights-portal/`:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

End-to-end tests require the full application stack to be running in another
terminal at <http://localhost:9010>:

```bash
npx playwright install chromium
npm run test:e2e
```
