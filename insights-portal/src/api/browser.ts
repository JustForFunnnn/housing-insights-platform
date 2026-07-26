import type {
  ErrorResponse,
  EstimateBatch,
  EstimatePage,
  MarketAnalysis,
  PropertyInput,
  PropertyPage,
  WhatIfRequest,
  WhatIfResponse,
} from "@/api/types";

type Dependency = "estimator" | "market";

const ESTIMATOR_API = (
  process.env.NEXT_PUBLIC_ESTIMATOR_SERVICE_URL ??
  "http://localhost:9001"
).replace(/\/$/, "");
const MARKET_API = (
  process.env.NEXT_PUBLIC_MARKET_SERVICE_URL ??
  "http://localhost:9002"
).replace(/\/$/, "");

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ErrorResponse,
  ) {
    super(body.message);
  }
}

function dependencyError(dependency: Dependency): ErrorResponse {
  const name = dependency === "estimator" ? "Estimator" : "Market analysis";
  return {
    error_code: `${dependency}_service_unavailable`,
    message: `${name} is temporarily unavailable. Try again shortly.`,
  };
}

function logApiError(
  dependency: Dependency,
  response: Response,
) {
  const requestId = response.headers.get("x-request-id");
  console.error(
    JSON.stringify({
      event: "api_request_failed",
      dependency,
      status: response.status,
      ...(requestId ? { request_id: requestId } : {}),
    }),
  );
}

async function fetchJson<T>(
  dependency: Dependency,
  input: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers,
    });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiError(503, dependencyError(dependency));
  }

  if (!response.ok) {
    logApiError(dependency, response);
    let body = dependencyError(dependency);
    try {
      const candidate = (await response.json()) as Partial<ErrorResponse>;
      if (
        typeof candidate.error_code === "string" &&
        typeof candidate.message === "string"
      ) {
        body = {
          error_code: candidate.error_code,
          message: candidate.message,
        };
      }
    } catch {
      // Keep the safe dependency error for non-JSON responses.
    }
    throw new ApiError(response.status, body);
  }

  return (await response.json()) as T;
}

export function toApiError(error: unknown): ErrorResponse {
  if (error instanceof ApiError) return error.body;
  return {
    error_code: "request_failed",
    message: "The request could not be completed.",
  };
}

function withQuery(base: string, query: URLSearchParams) {
  const value = query.toString();
  return `${base}${value ? `?${value}` : ""}`;
}

export function createEstimates(properties: PropertyInput[]) {
  return fetchJson<EstimateBatch>(
    "estimator",
    `${ESTIMATOR_API}/api/estimates`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    },
  );
}

export function getEstimateHistory(
  limit: number,
  offset: number,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return fetchJson<EstimatePage>(
    "estimator",
    withQuery(`${ESTIMATOR_API}/api/estimates`, query),
    { signal },
  );
}

export function getMarketAnalysis(
  query: URLSearchParams,
  signal?: AbortSignal,
) {
  return fetchJson<MarketAnalysis>(
    "market",
    withQuery(`${MARKET_API}/api/analysis`, query),
    { signal },
  );
}

export function getMarketProperties(
  query: URLSearchParams,
  signal?: AbortSignal,
) {
  return fetchJson<PropertyPage>(
    "market",
    withQuery(`${MARKET_API}/api/properties`, query),
    { signal },
  );
}

export function marketCsvExportUrl(query: URLSearchParams) {
  return withQuery(`${MARKET_API}/api/properties/export/csv`, query);
}

export function marketPdfExportUrl(query: URLSearchParams) {
  return withQuery("/api/reports/market", query);
}

export function runWhatIf(payload: WhatIfRequest) {
  return fetchJson<WhatIfResponse>(
    "market",
    `${MARKET_API}/api/what-if`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
