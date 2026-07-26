import type { ZodType } from "zod";

import {
  errorResponseSchema,
  type ErrorResponse,
} from "@/api/types";

export type Dependency = "estimator" | "market";

function dependencyName(dependency: Dependency) {
  return dependency === "estimator" ? "Estimator" : "Market analysis";
}

export function dependencyError(
  dependency: Dependency,
): ErrorResponse {
  return {
    error_code: `${dependency}_service_unavailable`,
    message: `${dependencyName(dependency)} is temporarily unavailable. Try again shortly.`,
  };
}

export function invalidResponseError(
  dependency: Dependency,
): ErrorResponse {
  return {
    error_code: `${dependency}_invalid_response`,
    message: `${dependencyName(dependency)} returned an invalid response.`,
  };
}

export function normalizeErrorResponse(
  candidate: unknown,
  dependency: Dependency,
): ErrorResponse {
  const result = errorResponseSchema.safeParse(candidate);
  return result.success ? result.data : dependencyError(dependency);
}

export async function parseResponseJson<T>(
  response: Response,
  schema: ZodType<T>,
): Promise<T> {
  const candidate: unknown = await response.json();
  return schema.parse(candidate);
}
