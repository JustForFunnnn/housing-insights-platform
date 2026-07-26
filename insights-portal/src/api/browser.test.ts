import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createEstimates,
  getMarketAnalysis,
  toApiError,
} from "@/api/browser";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client", () => {
  it("preserves a backend error response", async () => {
    const fetchMock = vi.fn(() =>
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
    );
    vi.stubGlobal("fetch", fetchMock);

    const error = await createEstimates([]).catch((reason) => reason);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/estimates$/),
      expect.objectContaining({ method: "POST" }),
    );
    expect(toApiError(error)).toEqual({
      error_code: "invalid_property",
      message: "Bedrooms are outside the allowed range.",
    });
  });

  it("maps unavailable market requests to a safe error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("connection refused"))),
    );

    const error = await getMarketAnalysis(
      new URLSearchParams(),
    ).catch((reason) => reason);

    expect(error).toMatchObject({ status: 503 });
    expect(toApiError(error)).toEqual({
      error_code: "market_service_unavailable",
      message:
        "Market analysis is temporarily unavailable. Try again shortly.",
    });
  });
});
