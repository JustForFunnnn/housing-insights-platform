"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { Pagination } from "@/components/pagination";
import type { EstimatePageResponse, FeatureKey, PropertyMetadataResponse } from "@/api/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { fieldUnit, PROPERTY_TABLE_COLUMNS } from "@/lib/fields";
import { listEstimates, toApiError } from "@/api/browser";

const PAGE_SIZE = 20;

function propertyValue(
  propertyFeatures: EstimatePageResponse["estimates"][number]["property_features"],
  key: FeatureKey,
  metadata: PropertyMetadataResponse,
) {
  if (key === "year_built") {
    return String(propertyFeatures[key]);
  }
  const unit = fieldUnit(metadata, key);
  return `${formatNumber(propertyFeatures[key])}${unit ? ` ${unit}` : ""}`;
}

export function HistoryView({
  metadata,
  initialPage,
}: {
  metadata: PropertyMetadataResponse;
  initialPage: EstimatePageResponse;
}) {
  const [offset, setOffset] = useState(initialPage.offset);
  const history = useQuery({
    queryKey: ["estimate-history", PAGE_SIZE, offset],
    queryFn: ({ signal }) => listEstimates(PAGE_SIZE, offset, signal),
    initialData: offset === initialPage.offset ? initialPage : undefined,
  });

  if (history.isError) {
    return <ErrorNotice error={toApiError(history.error)} onRetry={() => history.refetch()} />;
  }

  const page = history.data;
  if (!page) return <div className="skeleton" aria-label="Loading history" />;

  return (
    <>
      {page.estimates.length === 0 ? (
        <div className="empty-state">
          <h2>No estimates in this range</h2>
          <p>Run an estimate first, or return to the previous history page.</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <caption className="sr-only">Previous property estimates, newest first</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                {PROPERTY_TABLE_COLUMNS.map((column) => (
                  <th scope="col" key={column.key}>
                    {column.label}
                  </th>
                ))}
                <th scope="col">Estimate</th>
              </tr>
            </thead>
            <tbody>
              {page.estimates.map((estimate) => (
                <tr key={`${estimate.created_at}-${estimate.estimated_price}`}>
                  <td>{formatDate(estimate.created_at)}</td>
                  {PROPERTY_TABLE_COLUMNS.map((column) => (
                    <td key={column.key} className="mono">
                      {propertyValue(estimate.property_features, column.key, metadata)}
                    </td>
                  ))}
                  <td className="mono">{formatPrice(estimate.estimated_price, metadata.price_currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        offset={page.offset}
        limit={page.limit}
        itemCount={page.estimates.length}
        total={page.total}
        busy={history.isFetching}
        onPage={setOffset}
      />
    </>
  );
}
