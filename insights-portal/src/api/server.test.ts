import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

describe("server backend client", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("preserves backend status and error details", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          { error_code: "invalid_request", message: "Invalid input" },
          { status: 422 },
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const backend = await import("@/api/server");

    await expect(
      backend.getEstimates(),
    ).rejects.toMatchObject({
      status: 422,
      body: {
        error_code: "invalid_request",
        message: "Invalid input",
      },
    });
  });

  it("maps a network failure to a safe dependency error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("connection refused"))),
    );
    const backend = await import("@/api/server");

    await expect(
      backend.getMarketAnalysis(),
    ).rejects.toMatchObject({
      status: 503,
      body: {
        error_code: "market_service_unavailable",
      },
    });
  });

  it("keeps the timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: string, init: RequestInit | undefined) =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () =>
            new Promise((_resolve, reject) => {
              init?.signal?.addEventListener("abort", () => {
                reject(new DOMException("aborted", "AbortError"));
              });
            }),
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const backend = await import("@/api/server");

    const request = backend.getMarketAnalysis();
    const assertion = expect(request).rejects.toMatchObject({
      status: 503,
      body: {
        error_code: "market_service_unavailable",
      },
    });
    await vi.advanceTimersByTimeAsync(8000);

    await assertion;
  });
});
