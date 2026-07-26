"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { ErrorNotice } from "@/components/error-notice";
import type {
  MarketAnalysis,
  MarketMetadata,
  PropertyPage,
  SortDirection,
  SortField,
} from "@/lib/api/types";
import {
  errorResponse,
  portalFetch,
} from "@/lib/browser-api";
import { formatPrice } from "@/lib/format";
import {
  applyMarketFilters,
  applyMarketPage,
  applyMarketSort,
  allowedMarketQuery,
  withMarketDefaults,
} from "@/lib/market-query";

import { MarketCharts } from "./market-charts";
import { MarketFilters } from "./market-filters";
import { PropertyTable } from "./property-table";

export function MarketDashboard({
  initialMetadata,
  initialAnalysis,
  initialProperties,
}: {
  initialMetadata: MarketMetadata;
  initialAnalysis: MarketAnalysis;
  initialProperties: PropertyPage;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = withMarketDefaults(
    new URLSearchParams(searchParams.toString()),
  );

  const filterQuery = allowedMarketQuery(current);
  const propertyQuery = allowedMarketQuery(current, {
    includePage: true,
    includeSort: true,
  });
  const metadata = useQuery({
    queryKey: ["market-metadata"],
    queryFn: () =>
      portalFetch<MarketMetadata>("/api/market/metadata"),
    initialData: initialMetadata,
    staleTime: 300_000,
  });
  const analysis = useQuery({
    queryKey: ["market-analysis", filterQuery.toString()],
    queryFn: () =>
      portalFetch<MarketAnalysis>(
        `/api/market/analysis?${filterQuery}`,
      ),
    initialData: initialAnalysis,
  });
  const properties = useQuery({
    queryKey: ["market-properties", propertyQuery.toString()],
    queryFn: () =>
      portalFetch<PropertyPage>(
        `/api/market/properties?${propertyQuery}`,
      ),
    initialData: initialProperties,
  });

  function navigate(next: URLSearchParams) {
    router.replace(`/market?${next.toString()}`, { scroll: false });
  }

  function applyFilters(filters: URLSearchParams) {
    navigate(applyMarketFilters(current, filters));
  }

  function sort(field: SortField, direction: SortDirection) {
    navigate(applyMarketSort(current, field, direction));
  }

  function page(offset: number) {
    navigate(applyMarketPage(current, offset));
  }

  if (metadata.isError) {
    return (
      <ErrorNotice
        error={errorResponse(metadata.error)}
        onRetry={() => metadata.refetch()}
      />
    );
  }

  const exportQuery = allowedMarketQuery(current, {
    includeSort: true,
  });

  return (
    <>
      <section
        className="parcel parcel-pad"
        data-coordinate="FILTER / M-01"
      >
        <div className="scenario-heading">
          <div>
            <p className="measure-label">Segment controls</p>
            <h2>Define the market parcel</h2>
          </div>
          <div className="button-row">
            <a
              className="button button-secondary"
              href={`/api/market/export/csv?${exportQuery}`}
            >
              <Download size={16} aria-hidden="true" />
              Export CSV
            </a>
            <a
              className="button button-secondary"
              href={`/api/market/export/pdf?${filterQuery}`}
            >
              <FileText size={16} aria-hidden="true" />
              Export PDF
            </a>
          </div>
        </div>
        <MarketFilters
          metadata={metadata.data}
          current={current}
          onApply={applyFilters}
          onReset={() => navigate(new URLSearchParams())}
        />
      </section>

      {analysis.isError ? (
        <div style={{ marginTop: 24 }}>
          <ErrorNotice
            error={errorResponse(analysis.error)}
            onRetry={() => analysis.refetch()}
          />
        </div>
      ) : analysis.data?.count === 0 ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <h2>No properties match this segment</h2>
          <p>
            Widen one or more ranges, or reset the filters to return to the
            complete dataset.
          </p>
        </div>
      ) : analysis.data ? (
        <>
          <section
            aria-label="Market summary"
            style={{ marginTop: 28 }}
          >
            <div className="metric-grid">
              <div className="metric">
                <span className="measure-label">Properties</span>
                <strong className="metric-value">
                  {analysis.data.count}
                </strong>
              </div>
              {[
                ["Minimum", analysis.data.price_summary.minimum],
                ["Average", analysis.data.price_summary.average],
                ["Median", analysis.data.price_summary.median],
                ["Maximum", analysis.data.price_summary.maximum],
              ].map(([label, value]) => (
                <div className="metric" key={String(label)}>
                  <span className="measure-label">{label}</span>
                  <strong className="metric-value">
                    {formatPrice(
                      value as number | null,
                      metadata.data.price_currency,
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <MarketCharts
            analysis={analysis.data}
            unit={metadata.data.price_currency}
          />
        </>
      ) : (
        <div
          className="skeleton"
          style={{ marginTop: 24 }}
          aria-label="Loading analysis"
        />
      )}

      <section style={{ marginTop: 34 }} aria-busy={properties.isFetching}>
        <p className="measure-label">Property register</p>
        <h2 className="instrument-title">Filtered records</h2>
        <p className="instrument-copy" style={{ marginBottom: 18 }}>
          Sort any column. Pagination changes the register only; exports
          include every matching property.
        </p>
        {properties.isError ? (
          <ErrorNotice
            error={errorResponse(properties.error)}
            onRetry={() => properties.refetch()}
          />
        ) : properties.data ? (
          properties.data.records.length === 0 ? (
            <div className="empty-state">
              <h2>No records on this page</h2>
              <p>Return to the previous page or change the active segment.</p>
            </div>
          ) : (
            <PropertyTable
              page={properties.data}
              metadata={metadata.data}
              onSort={sort}
              onPage={page}
              busy={properties.isFetching}
            />
          )
        ) : (
          <div className="skeleton" aria-label="Loading properties" />
        )}
      </section>
    </>
  );
}
