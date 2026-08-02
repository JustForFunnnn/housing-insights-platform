import type { MarketAnalysisResponse, MarketMetadataResponse } from "@/api/types";
import { marketChartSeries } from "@/lib/chart-data";
import { formatPrice } from "@/lib/format";

export function buildMarketReportData(
  analysis: MarketAnalysisResponse,
  metadata: MarketMetadataResponse,
  filterSummary: string,
) {
  const charts = marketChartSeries(analysis);
  return {
    segment: filterSummary || "Complete dataset",
    metrics: [
      { label: "Properties", value: String(analysis.count) },
      {
        label: "Minimum",
        value: formatPrice(analysis.price_summary.minimum, metadata.price_currency),
      },
      {
        label: "Average",
        value: formatPrice(analysis.price_summary.average, metadata.price_currency),
      },
      {
        label: "Median",
        value: formatPrice(analysis.price_summary.median, metadata.price_currency),
      },
      {
        label: "Maximum",
        value: formatPrice(analysis.price_summary.maximum, metadata.price_currency),
      },
    ],
    charts,
  };
}
