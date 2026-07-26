import { PageHeader } from "@/components/page-header";
import { MarketDashboard } from "@/features/market/market-dashboard";
import {
  allowedMarketQuery,
} from "@/lib/market-query";
import {
  getMarketAnalysis,
  getMarketMetadata,
  getMarketProperties,
} from "@/server/backend";

export const dynamic = "force-dynamic";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

function toSearchParams(values: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const input = toSearchParams(await searchParams);
  if (!input.has("limit")) input.set("limit", "20");
  if (!input.has("offset")) input.set("offset", "0");
  if (!input.has("sort_by")) input.set("sort_by", "id");
  if (!input.has("sort_direction")) {
    input.set("sort_direction", "asc");
  }
  const filterQuery = allowedMarketQuery(input).toString();
  const propertyQuery = allowedMarketQuery(input, {
    includePage: true,
    includeSort: true,
  }).toString();

  const [metadata, analysis, properties] = await Promise.all([
    getMarketMetadata(),
    getMarketAnalysis(filterQuery),
    getMarketProperties(propertyQuery),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Java application / market"
        title="Read the market as measured ground."
        description="Define a property segment, compare its price structure, inspect every matching record, and export the exact view."
      />
      <MarketDashboard
        initialMetadata={metadata}
        initialAnalysis={analysis}
        initialProperties={properties}
      />
    </>
  );
}
