import type { MarketAnalysis } from "@/lib/api/types";

export interface ChartDatum {
  label: string;
  value: number;
  count: number;
}

export function marketChartSeries(analysis: MarketAnalysis) {
  return {
    priceDistribution: analysis.visualisations.price_distribution.map(
      (item) => ({
        label: item.label,
        value: item.count,
        count: item.count,
      }),
    ),
    bedrooms: analysis.visualisations.average_price_by_bedrooms.map(
      (item) => ({
        label: `${item.bedrooms} bed`,
        value: Number(item.average_price),
        count: item.count,
      }),
    ),
    decades:
      analysis.visualisations.average_price_by_year_built_decade.map(
        (item) => ({
          label: item.label,
          value: Number(item.average_price),
          count: item.count,
        }),
      ),
    squareFootage:
      analysis.visualisations.average_price_by_square_footage_band.map(
        (item) => ({
          label: item.label,
          value: Number(item.average_price),
          count: item.count,
        }),
      ),
  };
}
