import { describe, expect, it } from "vitest";

import type { MarketAnalysisResponse, MarketMetadataResponse } from "@/api/types";
import { buildMarketReportData } from "@/lib/market-report-data";

const analysis: MarketAnalysisResponse = {
  count: 1,
  price_summary: {
    minimum: 200000,
    maximum: 200000,
    average: 200000,
    median: 200000,
  },
  chart_data: {
    price_distribution: [
      {
        lower_bound: 200000,
        upper_bound_exclusive: 250000,
        count: 1,
      },
    ],
    average_price_by_bedrooms: [{ bedrooms: 3, average_price: 200000, count: 1 }],
    average_price_by_year_built_decade: [
      {
        start_year: 2000,
        end_year: 2009,
        average_price: 200000,
        count: 1,
      },
    ],
    average_price_by_square_footage_band: [
      {
        lower_bound: 1500,
        upper_bound_exclusive: 2000,
        average_price: 200000,
        count: 1,
      },
    ],
  },
};

const metadata = {
  features: {},
  price_currency: "USD",
  available_filters: {
    square_footage: { minimum: 1500, maximum: 1999 },
    bedrooms: [3],
    bathrooms: [2],
    year_built: { minimum: 2000, maximum: 2009 },
    lot_size: { minimum: 5000, maximum: 5000 },
    distance_to_city_center: { minimum: 4, maximum: 4 },
    school_rating: { minimum: 8, maximum: 8 },
    price: { minimum: 200000, maximum: 200000 },
  },
} as unknown as MarketMetadataResponse;

describe("PDF report data", () => {
  it("contains the active filters, currency statistics, and all chart series", () => {
    const report = buildMarketReportData(analysis, metadata, "bedrooms=3, min_price=150000");
    expect(report.segment).toContain("bedrooms=3");
    expect(report.metrics).toEqual(
      expect.arrayContaining([
        { label: "Properties", value: "1" },
        { label: "Median", value: "$200,000" },
      ]),
    );
    expect(report.charts.priceDistribution).toEqual([{ label: "[200,000, 250,000)", value: 1, count: 1 }]);
    expect(report.charts.bedrooms).toEqual([{ label: "3 bed", value: 200000, count: 1 }]);
    expect(report.charts.decades).toEqual([{ label: "2000s", value: 200000, count: 1 }]);
    expect(report.charts.squareFootage).toEqual([{ label: "[1,500, 2,000)", value: 200000, count: 1 }]);
  });

  it("preserves empty-analysis nulls as unavailable instead of fake zeroes", () => {
    const report = buildMarketReportData(
      {
        ...analysis,
        count: 0,
        price_summary: {
          minimum: null,
          maximum: null,
          average: null,
          median: null,
        },
        chart_data: {
          price_distribution: [],
          average_price_by_bedrooms: [],
          average_price_by_year_built_decade: [],
          average_price_by_square_footage_band: [],
        },
      },
      metadata,
      "",
    );
    expect(report.metrics.slice(1).every((item) => item.value === "Not available")).toBe(true);
    expect(Object.values(report.charts).every((series) => series.length === 0)).toBe(true);
  });
});
