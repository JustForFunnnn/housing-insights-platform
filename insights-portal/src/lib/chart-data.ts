import type { MarketAnalysisResponse } from "@/api/types";
import { formatNumber } from "@/lib/format";

export interface ChartDatum {
  label: string;
  value: number;
  count: number;
}

export const MARKET_CHART_DEFINITIONS = [
  {
    key: "priceDistribution",
    coordinate: "CHART / A-21",
    title: "Price distribution",
    description: "Property count across equal price bands.",
    priceValues: false,
    type: "bar",
  },
  {
    key: "bedrooms",
    coordinate: "CHART / B-21",
    title: "Average by bedrooms",
    description: "Mean price for each bedroom count in the active segment.",
    priceValues: true,
    type: "bar",
  },
  {
    key: "decades",
    coordinate: "CHART / A-22",
    title: "Average by build decade",
    description: "How mean price changes across construction eras.",
    priceValues: true,
    type: "line",
  },
  {
    key: "squareFootage",
    coordinate: "CHART / B-22",
    title: "Average by interior area",
    description: "Mean price across square-footage bands.",
    priceValues: true,
    type: "bar",
  },
] as const;

function formatRange(lower: number, upperExclusive: number | null) {
  const formattedLower = formatNumber(lower, 0);
  const formattedUpper = upperExclusive === null ? "∞" : formatNumber(upperExclusive, 0);
  return `[${formattedLower}, ${formattedUpper})`;
}

function formatDecade(startYear: number) {
  return `${startYear}s`;
}

export function marketChartSeries(analysis: MarketAnalysisResponse) {
  return {
    priceDistribution: analysis.chart_data.price_distribution.map((item) => ({
      label: formatRange(item.lower_bound, item.upper_bound_exclusive),
      value: item.count,
      count: item.count,
    })),
    bedrooms: analysis.chart_data.average_price_by_bedrooms.map((item) => ({
      label: `${item.bedrooms} bed`,
      value: Number(item.average_price),
      count: item.count,
    })),
    decades: analysis.chart_data.average_price_by_year_built_decade.map((item) => ({
      label: formatDecade(item.start_year),
      value: Number(item.average_price),
      count: item.count,
    })),
    squareFootage: analysis.chart_data.average_price_by_square_footage_band.map((item) => ({
      label: formatRange(item.lower_bound, item.upper_bound_exclusive),
      value: Number(item.average_price),
      count: item.count,
    })),
  };
}
