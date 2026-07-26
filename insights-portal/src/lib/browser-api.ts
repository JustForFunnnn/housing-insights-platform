import type { ErrorResponse } from "@/lib/api/types";

export class PortalApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ErrorResponse,
  ) {
    super(body.message);
  }
}

export async function portalFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let body: ErrorResponse = {
      error_code: "portal_request_failed",
      message: "The request could not be completed.",
    };
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
      // Retain the safe fallback.
    }
    throw new PortalApiError(response.status, body);
  }
  return (await response.json()) as T;
}

export function errorResponse(error: unknown): ErrorResponse {
  if (error instanceof PortalApiError) return error.body;
  return {
    error_code: "portal_request_failed",
    message: "The request could not be completed.",
  };
}
