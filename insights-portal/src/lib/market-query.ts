import { FEATURE_KEYS, type PropertyInput, type SortDirection, type SortField } from "@/api/types";

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

export function whatIfHref(property: PropertyInput) {
  const query = new URLSearchParams();
  for (const key of FEATURE_KEYS) {
    query.set(key, String(property[key]));
  }
  return `/market/what-if?${query.toString()}`;
}

export function withMarketDefaults(source: URLSearchParams) {
  const next = new URLSearchParams(source);
  if (!next.has("limit")) next.set("limit", "20");
  if (!next.has("offset")) next.set("offset", "0");
  if (!next.has("sort_by")) next.set("sort_by", "id");
  if (!next.has("sort_direction")) next.set("sort_direction", "asc");
  return next;
}

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

export function applyMarketFilters(current: URLSearchParams, filters: URLSearchParams) {
  const next = new URLSearchParams(filters);
  next.set("sort_by", current.get("sort_by") ?? "id");
  next.set("sort_direction", current.get("sort_direction") ?? "asc");
  next.set("limit", current.get("limit") ?? "20");
  next.set("offset", "0");
  return next;
}

export function applyMarketSort(current: URLSearchParams, field: SortField, direction: SortDirection) {
  const next = withMarketDefaults(current);
  next.set("sort_by", field);
  next.set("sort_direction", direction);
  next.set("offset", "0");
  return next;
}

export function applyMarketPage(current: URLSearchParams, offset: number) {
  const next = withMarketDefaults(current);
  next.set("offset", String(offset));
  return next;
}
