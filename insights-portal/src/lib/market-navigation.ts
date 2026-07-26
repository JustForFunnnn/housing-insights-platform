import type { SortDirection, SortField } from "@/lib/api/types";

export function withMarketDefaults(source: URLSearchParams) {
  const next = new URLSearchParams(source);
  if (!next.has("limit")) next.set("limit", "20");
  if (!next.has("offset")) next.set("offset", "0");
  if (!next.has("sort_by")) next.set("sort_by", "id");
  if (!next.has("sort_direction")) next.set("sort_direction", "asc");
  return next;
}

export function applyMarketFilters(
  current: URLSearchParams,
  filters: URLSearchParams,
) {
  const next = new URLSearchParams(filters);
  next.set("sort_by", current.get("sort_by") ?? "id");
  next.set("sort_direction", current.get("sort_direction") ?? "asc");
  next.set("limit", current.get("limit") ?? "20");
  next.set("offset", "0");
  return next;
}

export function applyMarketSort(
  current: URLSearchParams,
  field: SortField,
  direction: SortDirection,
) {
  const next = withMarketDefaults(current);
  next.set("sort_by", field);
  next.set("sort_direction", direction);
  next.set("offset", "0");
  return next;
}

export function applyMarketPage(
  current: URLSearchParams,
  offset: number,
) {
  const next = withMarketDefaults(current);
  next.set("offset", String(offset));
  return next;
}
