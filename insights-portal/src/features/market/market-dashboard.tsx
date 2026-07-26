"use client";

import { Download, FileText } from "lucide-react";

import { ErrorNotice } from "@/components/error-notice";
import type {
  MarketAnalysis,
  MarketMetadata,
  PropertyPage,
} from "@/api/types";
import { formatPrice } from "@/lib/format";
import {
  marketCsvExportUrl,
  marketPdfExportUrl,
  toApiError,
} from "@/api/browser";

import { MarketCharts } from "./market-charts";
import { MarketFilters } from "./market-filters";
import { PropertyTable } from "./property-table";
import { useMarketDashboard } from "./use-market-dashboard";

export function MarketDashboard({
  initialMetadata,
  initialAnalysis,
  initialProperties,
  initialFilterQuery,
  initialPropertyQuery,
}: {
  initialMetadata: MarketMetadata;
  initialAnalysis: MarketAnalysis;
  initialProperties: PropertyPage;
  initialFilterQuery: string;
  initialPropertyQuery: string;
}) {
  const {
    analysis,
    properties,
    current,
    filterQuery,
    exportQuery,
    applyFilters,
    resetFilters,
    sort,
    page,
  } = useMarketDashboard({
    analysis: initialAnalysis,
    properties: initialProperties,
    filterQuery: initialFilterQuery,
    propertyQuery: initialPropertyQuery,
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
              href={marketCsvExportUrl(exportQuery)}
            >
              <Download size={16} aria-hidden="true" />
              Export CSV
            </a>
            <a
              className="button button-secondary"
              href={marketPdfExportUrl(filterQuery)}
            >
              <FileText size={16} aria-hidden="true" />
              Export PDF
            </a>
          </div>
        </div>
        <MarketFilters
          metadata={initialMetadata}
          current={current}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </section>

      {analysis.isError ? (
        <div style={{ marginTop: 24 }}>
          <ErrorNotice
            error={toApiError(analysis.error)}
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
                      initialMetadata.price_currency,
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <MarketCharts
            analysis={analysis.data}
            unit={initialMetadata.price_currency}
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
            error={toApiError(properties.error)}
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
              metadata={initialMetadata}
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
