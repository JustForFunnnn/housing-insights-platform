import "server-only";

import type {
  ErrorResponse,
  EstimatePage,
  MarketAnalysis,
  MarketMetadata,
  PropertyMetadata,
  PropertyPage,
} from "@/api/types";

type Dependency = "estimator" | "market";

const SERVICE_URLS: Record<Dependency, () => string> = {
  estimator: () =>
    process.env.ESTIMATOR_SERVICE_URL ?? "http://localhost:9001",
  market: () =>
    process.env.MARKET_SERVICE_URL ?? "http://localhost:9002",
};

export class BackendError extends Error {
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

async function errorBody(
  response: Response,
  dependency: Dependency,
  signal: AbortSignal,
): Promise<ErrorResponse> {
  try {
    const body = (await response.json()) as Partial<ErrorResponse>;
    if (
      typeof body.error_code === "string" &&
      typeof body.message === "string"
    ) {
      return {
        error_code: body.error_code,
        message: body.message,
      };
    }
  } catch (error) {
    if (signal.aborted) throw error;
    // The safe dependency error below handles non-JSON responses.
  }
  return dependencyError(dependency);
}

function logBackendError(
  dependency: Dependency,
  path: string,
  init: RequestInit,
  response: Response,
) {
  const requestId = response.headers.get("x-request-id");
  console.error(
    JSON.stringify({
      event: "backend_request_failed",
      dependency,
      method: (init.method ?? "GET").toUpperCase(),
      path: path.split("?", 1)[0],
      status: response.status,
      ...(requestId ? { request_id: requestId } : {}),
    }),
  );
}

async function backendJson<T>(
  dependency: Dependency,
  path: string,
  init: RequestInit = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(`${SERVICE_URLS[dependency]()}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      logBackendError(dependency, path, init, response);
      const body = await errorBody(
        response,
        dependency,
        controller.signal,
      );
      throw new BackendError(response.status, body);
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      if (controller.signal.aborted) throw error;
      const body = {
        error_code: `${dependency}_invalid_response`,
        message: `${
          dependency === "estimator"
            ? "Estimator"
            : "Market analysis"
        } returned an invalid response.`,
      };
      throw new BackendError(502, body);
    }
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(503, dependencyError(dependency));
  } finally {
    clearTimeout(timer);
  }
}

export function getEstimatorMetadata() {
  return backendJson<PropertyMetadata>("estimator", "/api/metadata");
}

export function getMarketMetadata() {
  return backendJson<MarketMetadata>("market", "/api/metadata");
}

export function getEstimates(query = "") {
  return backendJson<EstimatePage>(
    "estimator",
    `/api/estimates${query ? `?${query}` : ""}`,
  );
}

export function getMarketAnalysis(query = "") {
  return backendJson<MarketAnalysis>(
    "market",
    `/api/analysis${query ? `?${query}` : ""}`,
  );
}

export function getMarketProperties(query = "") {
  return backendJson<PropertyPage>(
    "market",
    `/api/properties${query ? `?${query}` : ""}`,
  );
}
