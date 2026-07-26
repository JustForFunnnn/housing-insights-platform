import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { backendFetch, backendJson } = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  backendJson: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/backend", () => ({
  backendFetch,
  backendJson,
  getEstimatorMetadata: vi.fn(),
  getMarketMetadata: vi.fn(),
}));

describe("route proxies", () => {
  beforeEach(() => {
    backendFetch.mockReset();
    backendJson.mockReset();
  });

  it("forwards only estimator history pagination", async () => {
    backendJson.mockResolvedValue({ estimates: [] });
    const { proxyJson } = await import("@/server/proxy");
    const request = new NextRequest(
      "http://localhost:9100/api/estimator/estimates?limit=20&offset=40&query=secret",
    );

    await proxyJson(request, "estimator", "/api/estimates", {
      query: "estimator-history",
    });

    expect(backendJson).toHaveBeenCalledWith(
      "estimator",
      "/api/estimates?limit=20&offset=40",
      { method: "GET" },
    );
  });

  it("forwards filters and sorting, excludes pagination, and preserves binary headers", async () => {
    backendFetch.mockResolvedValue(
      new Response(new Uint8Array([65, 66, 67]), {
        headers: {
          "Content-Type": "text/csv;charset=UTF-8",
          "Content-Disposition":
            'attachment; filename="selected-properties.csv"',
        },
      }),
    );
    const { proxyCsv } = await import("@/server/proxy");
    const request = new NextRequest(
      "http://localhost:9100/api/market/export/csv?bedrooms=2&bedrooms=3&sort_by=price&sort_direction=desc&limit=20&offset=40&unsafe=secret",
    );

    const response = await proxyCsv(request);
    expect(backendFetch).toHaveBeenCalledWith(
      "market",
      "/api/properties/export/csv?bedrooms=2&bedrooms=3&sort_by=price&sort_direction=desc",
      { headers: { Accept: "text/csv" } },
    );
    expect(response.headers.get("Content-Type")).toBe(
      "text/csv;charset=UTF-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="selected-properties.csv"',
    );
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([
      65, 66, 67,
    ]);
  });
});
