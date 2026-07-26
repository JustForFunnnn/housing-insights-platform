import { describe, expect, it } from "vitest";

import {
  allowedMarketQuery,
  estimatorHistoryQuery,
} from "@/lib/market-query";

describe("API query allowlists", () => {
  it("preserves repeated segment values and drops unknown inputs", () => {
    const source = new URLSearchParams(
      "bedrooms=2&bedrooms=3&bathrooms=1.5&bathrooms=2&min_price=100000&unsafe=value&limit=20",
    );
    const result = allowedMarketQuery(source, { includePage: true });

    expect(result.getAll("bedrooms")).toEqual(["2", "3"]);
    expect(result.getAll("bathrooms")).toEqual(["1.5", "2"]);
    expect(result.get("min_price")).toBe("100000");
    expect(result.get("limit")).toBe("20");
    expect(result.has("unsafe")).toBe(false);
  });

  it("separates analysis filters from table paging and sorting", () => {
    const source = new URLSearchParams(
      "bedrooms=3&limit=20&offset=40&sort_by=price&sort_direction=desc",
    );
    expect(allowedMarketQuery(source).toString()).toBe("bedrooms=3");
    expect(
      allowedMarketQuery(source, {
        includePage: true,
        includeSort: true,
      }).toString(),
    ).toBe(
      "bedrooms=3&sort_by=price&sort_direction=desc&limit=20&offset=40",
    );
  });

  it("allows only estimator pagination parameters", () => {
    const result = estimatorHistoryQuery(
      new URLSearchParams("limit=20&offset=40&query=secret"),
    );
    expect(result.toString()).toBe("limit=20&offset=40");
  });
});
