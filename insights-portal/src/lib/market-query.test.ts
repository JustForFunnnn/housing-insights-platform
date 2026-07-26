import { describe, expect, it } from "vitest";

import {
  applyMarketFilters,
  applyMarketPage,
  applyMarketSort,
  allowedMarketQuery,
  withMarketDefaults,
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
});

describe("market URL state", () => {
  it("adds stable defaults without discarding repeated filters", () => {
    const result = withMarketDefaults(
      new URLSearchParams("bedrooms=2&bedrooms=3"),
    );
    expect(result.getAll("bedrooms")).toEqual(["2", "3"]);
    expect(result.get("limit")).toBe("20");
    expect(result.get("offset")).toBe("0");
  });

  it("resets pagination whenever filters or sorting change", () => {
    const current = new URLSearchParams(
      "offset=60&limit=20&sort_by=price&sort_direction=desc",
    );
    const filtered = applyMarketFilters(
      current,
      new URLSearchParams("bedrooms=4"),
    );
    expect(filtered.get("offset")).toBe("0");
    expect(filtered.get("sort_by")).toBe("price");

    const sorted = applyMarketSort(current, "year_built", "asc");
    expect(sorted.get("offset")).toBe("0");
    expect(sorted.get("sort_by")).toBe("year_built");
  });

  it("changes pagination without altering filters or sorting", () => {
    const current = new URLSearchParams(
      "bedrooms=3&sort_by=price&sort_direction=desc&limit=20",
    );
    const result = applyMarketPage(current, 40);
    expect(result.get("bedrooms")).toBe("3");
    expect(result.get("sort_by")).toBe("price");
    expect(result.get("offset")).toBe("40");
  });
});
