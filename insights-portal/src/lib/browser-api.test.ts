import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PortalApiError,
  errorResponse,
  portalFetch,
} from "@/lib/browser-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser API errors", () => {
  it("keeps the backend status and flat error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error_code: "invalid_property",
              message: "Bedrooms are outside the allowed range.",
            }),
            {
              status: 422,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
      ),
    );

    await expect(portalFetch("/api/estimator/estimates")).rejects.toEqual(
      expect.objectContaining({
        status: 422,
        body: {
          error_code: "invalid_property",
          message: "Bedrooms are outside the allowed range.",
        },
      }),
    );
  });

  it("returns a safe fallback for non-JSON and unknown errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response("gateway", { status: 503 })),
      ),
    );
    await expect(portalFetch("/api/market/analysis")).rejects.toMatchObject({
      status: 503,
      body: {
        error_code: "portal_request_failed",
      },
    });
    expect(errorResponse(new Error("private details"))).toEqual({
      error_code: "portal_request_failed",
      message: "The request could not be completed.",
    });
    expect(
      errorResponse(
        new PortalApiError(503, {
          error_code: "market_service_unavailable",
          message: "Market analysis is temporarily unavailable.",
        }),
      ),
    ).toEqual({
      error_code: "market_service_unavailable",
      message: "Market analysis is temporarily unavailable.",
    });
  });
});
