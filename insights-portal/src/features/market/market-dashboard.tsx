"use client";

import { Download, FileText } from "lucide-react";

import { ErrorNotice } from "@/components/error-notice";
import type { MarketAnalysisResponse, MarketMetadataResponse, PropertyPageResponse } from "@/api/types";
import { formatPrice } from "@/lib/format";
import { marketCsvExportUrl, marketPdfExportUrl, toApiError } from "@/api/browser";

import { MarketCharts } from "./market-charts";
import { MarketFilters } from "./market-filters";
import { PropertyTable } from "./property-table";
import { useMarketDashboard } from "./use-market-dashboard";

export function MarketDashboard({
  initialMetadata,
  initialAnalysis,
  initialPropertyPage,
  initialFilterQuery,
  initialPropertyQuery,
}: {
  initialMetadata: MarketMetadataResponse;
  initialAnalysis: MarketAnalysisResponse;
  initialPropertyPage: PropertyPageResponse;
  initialFilterQuery: string;
  initialPropertyQuery: string;
}) {
  const { analysisQuery, propertyPageQuery, current, applyFilters, resetFilters, sort, page } = useMarketDashboard({
    analysis: initialAnalysis,
    propertyPage: initialPropertyPage,
    filterQuery: initialFilterQuery,
    propertyQuery: initialPropertyQuery,
  });

  return (
    <>
      <section className="parcel parcel-pad" data-coordinate="FILTER / M-01">
        <div className="scenario-heading">
          <div>
            <p className="measure-label">Segment controls</p>
            <h2>Define the market parcel</h2>
          </div>
          <div className="button-row">
            <button
              className="button button-secondary"
              type="submit"
              form="market-filters"
              formAction={marketCsvExportUrl(new URLSearchParams())}
              formMethod="get"
              data-export="true"
            >
              <Download size={16} aria-hidden="true" />
              Export CSV
            </button>
            <button
              className="button button-secondary"
              type="submit"
              form="market-filters"
              formAction={marketPdfExportUrl(new URLSearchParams())}
              formMethod="get"
              data-export="true"
            >
              <FileText size={16} aria-hidden="true" />
              Export PDF
            </button>
          </div>
        </div>
        <MarketFilters metadata={initialMetadata} current={current} onApply={applyFilters} onReset={resetFilters} />
      </section>

      {analysisQuery.isError ? (
        <div style={{ marginTop: 24 }}>
          <ErrorNotice error={toApiError(analysisQuery.error)} onRetry={() => analysisQuery.refetch()} />
        </div>
      ) : analysisQuery.data?.count === 0 ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <h2>No properties match this segment</h2>
          <p>Widen one or more ranges, or reset the filters to return to the complete dataset.</p>
        </div>
      ) : analysisQuery.data ? (
        <>
          <section aria-label="Market summary" style={{ marginTop: 28 }}>
            <div className="metric-grid">
              <div className="metric">
                <span className="measure-label">Properties</span>
                <strong className="metric-value">{analysisQuery.data.count}</strong>
              </div>
              {[
                ["Minimum", analysisQuery.data.price_summary.minimum],
                ["Average", analysisQuery.data.price_summary.average],
                ["Median", analysisQuery.data.price_summary.median],
                ["Maximum", analysisQuery.data.price_summary.maximum],
              ].map(([label, value]) => (
                <div className="metric" key={String(label)}>
                  <span className="measure-label">{label}</span>
                  <strong className="metric-value">
                    {formatPrice(value as number | null, initialMetadata.price_currency)}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <MarketCharts analysis={analysisQuery.data} unit={initialMetadata.price_currency} />
        </>
      ) : (
        <div className="skeleton" style={{ marginTop: 24 }} aria-label="Loading analysis" />
      )}

      <section style={{ marginTop: 34 }} aria-busy={propertyPageQuery.isFetching}>
        <p className="measure-label">Property register</p>
        <h2 className="instrument-title">Filtered properties</h2>
        <p className="instrument-copy" style={{ marginBottom: 18 }}>
          Sort any column. Pagination changes the register only; exports include every matching property.
        </p>
        {propertyPageQuery.isError ? (
          <ErrorNotice error={toApiError(propertyPageQuery.error)} onRetry={() => propertyPageQuery.refetch()} />
        ) : propertyPageQuery.data ? (
          propertyPageQuery.data.properties.length === 0 ? (
            <div className="empty-state">
              <h2>No properties on this page</h2>
              <p>Return to the previous page or change the active segment.</p>
            </div>
          ) : (
            <PropertyTable
              propertyPage={propertyPageQuery.data}
              metadata={initialMetadata}
              onSort={sort}
              onPage={page}
              busy={propertyPageQuery.isFetching}
            />
          )
        ) : (
          <div className="skeleton" aria-label="Loading properties" />
        )}
      </section>
    </>
  );
}
