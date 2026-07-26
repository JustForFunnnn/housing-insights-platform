import type {
  MarketAnalysis,
  MarketMetadata,
} from "@/lib/api/types";
import { marketChartSeries } from "@/lib/chart-data";
import { formatPrice } from "@/lib/format";

export function buildMarketReportData(
  analysis: MarketAnalysis,
  metadata: MarketMetadata,
  filterSummary: string,
) {
  const charts = marketChartSeries(analysis);
  return {
    segment: filterSummary || "Complete dataset",
    metrics: [
      { label: "Properties", value: String(analysis.count) },
      {
        label: "Minimum",
        value: formatPrice(
          analysis.price_summary.minimum,
          metadata.price.unit,
        ),
      },
      {
        label: "Average",
        value: formatPrice(
          analysis.price_summary.average,
          metadata.price.unit,
        ),
      },
      {
        label: "Median",
        value: formatPrice(
          analysis.price_summary.median,
          metadata.price.unit,
        ),
      },
      {
        label: "Maximum",
        value: formatPrice(
          analysis.price_summary.maximum,
          metadata.price.unit,
        ),
      },
    ],
    charts: [
      {
        title: "Price distribution",
        data: charts.priceDistribution,
        price: false,
      },
      {
        title: "Average price by bedrooms",
        data: charts.bedrooms,
        price: true,
      },
      {
        title: "Average price by build decade",
        data: charts.decades,
        price: true,
      },
      {
        title: "Average price by interior area",
        data: charts.squareFootage,
        price: true,
      },
    ],
  };
}
