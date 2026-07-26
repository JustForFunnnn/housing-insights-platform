"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import type {
  EstimatePage,
  PropertyMetadata,
} from "@/api/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  getEstimateHistory,
  toApiError,
} from "@/api/browser";

const PAGE_SIZE = 20;

export function HistoryView({
  metadata,
  initialPage,
}: {
  metadata: PropertyMetadata;
  initialPage: EstimatePage;
}) {
  const [offset, setOffset] = useState(initialPage.offset);
  const history = useQuery({
    queryKey: ["estimate-history", PAGE_SIZE, offset],
    queryFn: ({ signal }) =>
      getEstimateHistory(PAGE_SIZE, offset, signal),
    initialData: offset === initialPage.offset ? initialPage : undefined,
  });

  if (history.isError) {
    return (
      <ErrorNotice
        error={toApiError(history.error)}
        onRetry={() => history.refetch()}
      />
    );
  }

  const page = history.data;
  if (!page) return <div className="skeleton" aria-label="Loading history" />;

  const start = page.total === 0 ? 0 : page.offset + 1;
  const end = Math.min(page.total, page.offset + page.estimates.length);

  return (
    <>
      {page.estimates.length === 0 ? (
        <div className="empty-state">
          <h2>No estimates in this range</h2>
          <p>
            Run an estimate first, or return to the previous history page.
          </p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <caption className="sr-only">
              Previous property estimates, newest first
            </caption>
            <thead>
              <tr>
                <th scope="col">Saved</th>
                <th scope="col">Estimate</th>
                <th scope="col">Area</th>
                <th scope="col">Beds</th>
                <th scope="col">Baths</th>
                <th scope="col">Year</th>
                <th scope="col">School</th>
              </tr>
            </thead>
            <tbody>
              {page.estimates.map((record) => (
                <tr
                  key={`${record.created_at}-${record.estimated_price}`}
                >
                  <td>{formatDate(record.created_at)}</td>
                  <td className="mono">
                    {formatPrice(
                      record.estimated_price,
                      metadata.price_currency,
                    )}
                  </td>
                  <td className="mono">
                    {formatNumber(record.property.square_footage)}{" "}
                    {metadata.features.square_footage.unit === "sq_ft"
                      ? "sq ft"
                      : metadata.features.square_footage.unit}
                  </td>
                  <td>{record.property.bedrooms}</td>
                  <td>{record.property.bathrooms}</td>
                  <td>{record.property.year_built}</td>
                  <td>{record.property.school_rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="button-row"
        style={{ justifyContent: "space-between", marginTop: 18 }}
      >
        <span className="measure-label">
          {start}–{end} of {page.total}
        </span>
        <div className="button-row">
          <button
            className="button button-secondary"
            disabled={offset === 0 || history.isFetching}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <button
            className="button button-secondary"
            disabled={
              offset + PAGE_SIZE >= page.total || history.isFetching
            }
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
