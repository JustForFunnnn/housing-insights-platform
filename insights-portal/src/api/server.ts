import "server-only";

import type { ZodType } from "zod";

import {
  dependencyError,
  invalidResponseError,
  normalizeErrorResponse,
  parseResponseJson,
  type Dependency,
} from "@/api/response";
import {
  estimatePageSchema,
  marketAnalysisSchema,
  marketMetadataSchema,
  propertyMetadataSchema,
  propertyPageSchema,
  type ErrorResponse,
} from "@/api/types";

const SERVICE_URLS: Record<Dependency, () => string> = {
  estimator: () => process.env.ESTIMATOR_SERVICE_URL ?? "http://localhost:9001",
  market: () => process.env.MARKET_SERVICE_URL ?? "http://localhost:9002",
};

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ErrorResponse,
  ) {
    super(body.message);
  }
}

async function errorBody(response: Response, dependency: Dependency, signal: AbortSignal): Promise<ErrorResponse> {
  try {
    return normalizeErrorResponse(await response.json(), dependency);
  } catch (error) {
    if (signal.aborted) throw error;
    // The safe dependency error below handles non-JSON responses.
  }
  return dependencyError(dependency);
}

function logBackendError(dependency: Dependency, path: string, init: RequestInit, response: Response) {
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

async function backendJson<T>(dependency: Dependency, path: string, schema: ZodType<T>, init: RequestInit = {}) {
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
      const body = await errorBody(response, dependency, controller.signal);
      throw new BackendError(response.status, body);
    }

    try {
      return await parseResponseJson(response, schema);
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new BackendError(502, invalidResponseError(dependency));
    }
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(503, dependencyError(dependency));
  } finally {
    clearTimeout(timer);
  }
}

export function getEstimatorMetadata() {
  return backendJson("estimator", "/api/metadata", propertyMetadataSchema);
}

export function getMarketMetadata() {
  return backendJson("market", "/api/metadata", marketMetadataSchema);
}

export function getEstimates(query = "") {
  return backendJson("estimator", `/api/estimates${query ? `?${query}` : ""}`, estimatePageSchema);
}

export function getMarketAnalysis(query = "") {
  return backendJson("market", `/api/analysis${query ? `?${query}` : ""}`, marketAnalysisSchema);
}

export function getMarketProperties(query = "") {
  return backendJson("market", `/api/properties${query ? `?${query}` : ""}`, propertyPageSchema);
}
