import { describe, expect, it } from "vitest";

import type { MarketAnalysisResponse } from "@/api/types";
import { marketChartSeries } from "@/lib/chart-data";

const analysis: MarketAnalysisResponse = {
  count: 2,
  price_summary: {
    minimum: 100000,
    maximum: 200000,
    average: 150000,
    median: 150000,
  },
  chart_data: {
    price_distribution: [
      {
        lower_bound: 100000,
        upper_bound_exclusive: 200000,
        count: 1,
      },
      {
        lower_bound: 200000,
        upper_bound_exclusive: null,
        count: 1,
      },
    ],
    average_price_by_bedrooms: [{ bedrooms: 3, average_price: 150000, count: 2 }],
    average_price_by_year_built_decade: [
      {
        start_year: 1990,
        end_year: 1999,
        average_price: 150000,
        count: 2,
      },
    ],
    average_price_by_square_footage_band: [
      {
        lower_bound: 1000,
        upper_bound_exclusive: 1500,
        average_price: 150000,
        count: 2,
      },
    ],
  },
};

describe("market chart series", () => {
  it("normalizes all four backend visualisation groups", () => {
    const result = marketChartSeries(analysis);
    expect(result.priceDistribution[0]).toEqual({
      label: "[100,000, 200,000)",
      value: 1,
      count: 1,
    });
    expect(result.priceDistribution[1].label).toBe("[200,000, ∞)");
    expect(result.bedrooms[0].value).toBe(150000);
    expect(result.decades[0].label).toBe("1990s");
    expect(result.squareFootage[0]).toEqual({
      label: "[1,000, 1,500)",
      value: 150000,
      count: 2,
    });
  });
});
