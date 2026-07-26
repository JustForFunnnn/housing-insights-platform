import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (
    loader: (...args: unknown[]) => Promise<unknown>,
    _key: string[],
    options: { revalidate: number },
  ) => {
    let value: unknown;
    let expiresAt = 0;
    let pending: Promise<unknown> | undefined;
    return async (...args: unknown[]) => {
      if (expiresAt > Date.now()) return value;
      if (pending) return pending;
      pending = loader(...args)
        .then((result) => {
          value = result;
          expiresAt = Date.now() + options.revalidate * 1_000;
          return result;
        })
        .finally(() => {
          pending = undefined;
        });
      return pending;
    };
  },
}));

const metadata = {
  fields: {
    square_footage: { min: 1, max: 100000, unit: "sq_ft" },
  },
  price: { unit: "USD" },
};

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
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps dependency metadata caches separate for five minutes", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(metadata)),
    );
    vi.stubGlobal("fetch", fetchMock);
    const backend = await import("@/server/backend");

    await backend.getEstimatorMetadata();
    await backend.getEstimatorMetadata();
    await backend.getMarketMetadata();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date("2026-01-01T00:04:59Z"));
    await backend.getEstimatorMetadata();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date("2026-01-01T00:05:01Z"));
    await backend.getEstimatorMetadata();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not cache a failed metadata request as a successful result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { error_code: "dependency_failed", message: "Unavailable" },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(jsonResponse(metadata));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const backend = await import("@/server/backend");

    await expect(backend.getEstimatorMetadata()).rejects.toMatchObject({
      status: 503,
    });
    await expect(backend.getEstimatorMetadata()).resolves.toEqual(metadata);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("logs a returned request ID only for backend error responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { error_code: "invalid_request", message: "Invalid input" },
          {
            status: 422,
            headers: { "X-Request-ID": "backend-request-42" },
          },
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          { status: "ok" },
          { headers: { "X-Request-ID": "successful-id" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const log = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const backend = await import("@/server/backend");

    await expect(
      backend.backendJson("estimator", "/api/estimates"),
    ).rejects.toMatchObject({
      status: 422,
      body: {
        error_code: "invalid_request",
        message: "Invalid input",
      },
    });
    const entry = JSON.parse(String(log.mock.calls[0][0]));
    expect(entry).toMatchObject({
      dependency: "estimator",
      method: "GET",
      path: "/api/estimates",
      status: 422,
      error_code: "invalid_request",
      request_id: "backend-request-42",
    });

    log.mockClear();
    await expect(
      backend.backendJson("estimator", "/api/health"),
    ).resolves.toEqual({ status: "ok" });
    expect(log).not.toHaveBeenCalled();
  });

  it("maps an eight-second timeout to a flat 503 without a synthetic ID", async () => {
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit | undefined) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const log = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const backend = await import("@/server/backend");

    const request = expect(
      backend.backendJson("market", "/api/analysis"),
    ).rejects.toMatchObject({
      status: 503,
      body: {
        error_code: "market_service_unavailable",
      },
    });
    await vi.advanceTimersByTimeAsync(8_000);
    await request;

    const entry = JSON.parse(String(log.mock.calls[0][0]));
    expect(entry).not.toHaveProperty("request_id");
    expect(entry).toMatchObject({
      dependency: "market",
      status: 503,
      error_code: "market_service_unavailable",
      reason: "AbortError",
    });
  });
});
