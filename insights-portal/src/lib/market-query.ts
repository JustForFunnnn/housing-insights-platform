import type { SortDirection, SortField } from "@/lib/api/types";

export const FILTER_KEYS = [
  "min_square_footage",
  "max_square_footage",
  "bedrooms",
  "bathrooms",
  "min_year_built",
  "max_year_built",
  "min_lot_size",
  "max_lot_size",
  "min_distance_to_city_center",
  "max_distance_to_city_center",
  "min_school_rating",
  "max_school_rating",
  "min_price",
  "max_price",
] as const;

export type MarketFilterKey = (typeof FILTER_KEYS)[number];

export function allowedMarketQuery(
  source: URLSearchParams,
  options: {
    includePage?: boolean;
    includeSort?: boolean;
  } = {},
) {
  const result = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    for (const value of source.getAll(key)) {
      if (value !== "") result.append(key, value);
    }
  }
  if (options.includeSort) {
    const sortBy = source.get("sort_by");
    const sortDirection = source.get("sort_direction");
    if (sortBy) result.set("sort_by", sortBy);
    if (sortDirection) result.set("sort_direction", sortDirection);
  }
  if (options.includePage) {
    const limit = source.get("limit");
    const offset = source.get("offset");
    if (limit) result.set("limit", limit);
    if (offset) result.set("offset", offset);
  }
  return result;
}

export function estimatorHistoryQuery(source: URLSearchParams) {
  const result = new URLSearchParams();
  const limit = source.get("limit");
  const offset = source.get("offset");
  if (limit) result.set("limit", limit);
  if (offset) result.set("offset", offset);
  return result;
}

export function marketSort(source: URLSearchParams): {
  sortBy: SortField;
  sortDirection: SortDirection;
} {
  return {
    sortBy: (source.get("sort_by") ?? "id") as SortField,
    sortDirection: (source.get("sort_direction") ?? "asc") as SortDirection,
  };
}
