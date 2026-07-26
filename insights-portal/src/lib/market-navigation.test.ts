import { describe, expect, it } from "vitest";

import {
  applyMarketFilters,
  applyMarketPage,
  applyMarketSort,
  withMarketDefaults,
} from "@/lib/market-navigation";

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
