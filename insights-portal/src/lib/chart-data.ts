import type { MarketAnalysis } from "@/api/types";

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

export function marketChartSeries(analysis: MarketAnalysis) {
  return {
    priceDistribution: analysis.visualisations.price_distribution.map((item) => ({
      label: item.label,
      value: item.count,
      count: item.count,
    })),
    bedrooms: analysis.visualisations.average_price_by_bedrooms.map((item) => ({
      label: `${item.bedrooms} bed`,
      value: Number(item.average_price),
      count: item.count,
    })),
    decades: analysis.visualisations.average_price_by_year_built_decade.map((item) => ({
      label: item.label,
      value: Number(item.average_price),
      count: item.count,
    })),
    squareFootage: analysis.visualisations.average_price_by_square_footage_band.map((item) => ({
      label: item.label,
      value: Number(item.average_price),
      count: item.count,
    })),
  };
}
