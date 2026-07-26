import { describe, expect, it } from "vitest";

import type { MarketAnalysis } from "@/api/types";
import { marketChartSeries } from "@/lib/chart-data";

const analysis: MarketAnalysis = {
  count: 2,
  price_summary: {
    minimum: 100000,
    maximum: 200000,
    average: 150000,
    median: 150000,
  },
  visualisations: {
    price_distribution: [
      {
        label: "100000-199999",
        lower_bound: 100000,
        upper_bound: 199999,
        count: 2,
      },
    ],
    average_price_by_bedrooms: [{ bedrooms: 3, average_price: 150000, count: 2 }],
    average_price_by_year_built_decade: [
      {
        label: "1990s",
        start_year: 1990,
        end_year: 1999,
        average_price: 150000,
        count: 2,
      },
    ],
    average_price_by_square_footage_band: [
      {
        label: "1000-1499",
        lower_bound: 1000,
        upper_bound_exclusive: 1500,
        average_price: 150000,
        count: 2,
      },
    ],
  },
  filter_options: {
    square_footage: { minimum: 1000, maximum: 1499 },
    bedrooms: [3],
    bathrooms: [2],
    year_built: { minimum: 1990, maximum: 1999 },
    lot_size: { minimum: 5000, maximum: 7000 },
    distance_to_city_center: { minimum: 1, maximum: 5 },
    school_rating: { minimum: 6, maximum: 9 },
    price: { minimum: 100000, maximum: 200000 },
  },
};

describe("market chart series", () => {
  it("normalizes all four backend visualisation groups", () => {
    const result = marketChartSeries(analysis);
    expect(result.priceDistribution[0]).toEqual({
      label: "100000-199999",
      value: 2,
      count: 2,
    });
    expect(result.bedrooms[0].value).toBe(150000);
    expect(result.decades[0].label).toBe("1990s");
    expect(result.squareFootage[0].count).toBe(2);
  });
});
