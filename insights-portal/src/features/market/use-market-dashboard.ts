"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { getMarketAnalysis, listMarketProperties } from "@/api/browser";
import type { MarketAnalysisResponse, PropertyPageResponse, SortDirection, SortField } from "@/api/types";
import {
  allowedMarketQuery,
  applyMarketFilters,
  applyMarketPage,
  applyMarketSort,
  withMarketDefaults,
} from "@/lib/market-query";

const STALE_TIME = 30000;

interface InitialMarketData {
  analysis: MarketAnalysisResponse;
  propertyPage: PropertyPageResponse;
  filterQuery: string;
  propertyQuery: string;
}

export function useMarketDashboard(initial: InitialMarketData) {
  const searchParams = useSearchParams();
  const current = withMarketDefaults(new URLSearchParams(searchParams.toString()));
  const filterQuery = allowedMarketQuery(current);
  const propertyQuery = allowedMarketQuery(current, {
    includePage: true,
    includeSort: true,
  });
  const filterQueryKey = filterQuery.toString();
  const propertyQueryKey = propertyQuery.toString();

  const analysisQuery = useQuery({
    queryKey: ["market-analysis", filterQueryKey],
    queryFn: ({ signal }) => getMarketAnalysis(filterQuery, signal),
    initialData: filterQueryKey === initial.filterQuery ? initial.analysis : undefined,
    staleTime: STALE_TIME,
  });
  const propertyPageQuery = useQuery({
    queryKey: ["market-properties", propertyQueryKey],
    queryFn: ({ signal }) => listMarketProperties(propertyQuery, signal),
    initialData: propertyQueryKey === initial.propertyQuery ? initial.propertyPage : undefined,
    staleTime: STALE_TIME,
  });

  function navigate(next: URLSearchParams) {
    const query = next.toString();
    window.history.replaceState(null, "", query ? `/market?${query}` : "/market");
  }

  return {
    analysisQuery,
    propertyPageQuery,
    current,
    applyFilters(filters: URLSearchParams) {
      navigate(applyMarketFilters(current, filters));
    },
    resetFilters() {
      navigate(new URLSearchParams());
    },
    sort(field: SortField, direction: SortDirection) {
      navigate(applyMarketSort(current, field, direction));
    },
    page(offset: number) {
      navigate(applyMarketPage(current, offset));
    },
  };
}
