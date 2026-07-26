import "server-only";

import { unstable_cache } from "next/cache";

import type {
  ErrorResponse,
  EstimateBatch,
  EstimatePage,
  MarketAnalysis,
  MarketMetadata,
  PropertyMetadata,
  PropertyPage,
  WhatIfResponse,
} from "@/lib/api/types";

export type Dependency = "estimator" | "market";

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
  } catch {
    // The safe dependency error below handles non-JSON responses.
  }
  return dependencyError(dependency);
}

export async function backendFetch(
  dependency: Dependency,
  path: string,
  init: RequestInit = {},
) {
  const method = init.method ?? "GET";
  const pathname = path.split("?")[0];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  let response: Response;
  try {
    response = await fetch(`${SERVICE_URLS[dependency]()}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "dependency_request_failed",
        dependency,
        method,
        path: pathname,
        status: 503,
        error_code: `${dependency}_service_unavailable`,
        reason: error instanceof Error ? error.name : "unknown",
      }),
    );
    throw new BackendError(503, dependencyError(dependency));
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await errorBody(response, dependency);
    const requestId = response.headers.get("X-Request-ID");
    console.error(
      JSON.stringify({
        event: "dependency_response_failed",
        dependency,
        method,
        path: pathname,
        status: response.status,
        error_code: body.error_code,
        ...(requestId ? { request_id: requestId } : {}),
      }),
    );
    throw new BackendError(response.status, body);
  }

  return response;
}

export async function backendJson<T>(
  dependency: Dependency,
  path: string,
  init: RequestInit = {},
) {
  const response = await backendFetch(dependency, path, init);
  return (await response.json()) as T;
}

export const getEstimatorMetadata = unstable_cache(
  () =>
    backendJson<PropertyMetadata>("estimator", "/api/metadata"),
  ["estimator-metadata-v1"],
  { revalidate: 300 },
);

export const getMarketMetadata = unstable_cache(
  () => backendJson<MarketMetadata>("market", "/api/metadata"),
  ["market-metadata-v1"],
  { revalidate: 300 },
);

export function getEstimates(query = "") {
  return backendJson<EstimatePage>(
    "estimator",
    `/api/estimates${query ? `?${query}` : ""}`,
  );
}

export function createEstimates(properties: unknown) {
  return backendJson<EstimateBatch>("estimator", "/api/estimates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(properties),
  });
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

export function runWhatIf(payload: unknown) {
  return backendJson<WhatIfResponse>("market", "/api/what-if", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function dependencyHealth(dependency: Dependency) {
  try {
    await backendJson<{ status: "ok" }>(dependency, "/api/health");
    return { status: "online" as const };
  } catch {
    return { status: "offline" as const };
  }
}
