"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

import type {
  MarketMetadata,
  PropertyPage,
  SortDirection,
  SortField,
} from "@/lib/api/types";
import { fieldUnit } from "@/lib/fields";
import { formatNumber, formatPrice } from "@/lib/format";

const columns: Array<{ key: SortField; label: string }> = [
  { key: "id", label: "ID" },
  { key: "square_footage", label: "Area" },
  { key: "bedrooms", label: "Beds" },
  { key: "bathrooms", label: "Baths" },
  { key: "year_built", label: "Year" },
  { key: "lot_size", label: "Lot" },
  { key: "distance_to_city_center", label: "Distance" },
  { key: "school_rating", label: "School" },
  { key: "price", label: "Price" },
];

export function PropertyTable({
  page,
  metadata,
  onSort,
  onPage,
  busy,
}: {
  page: PropertyPage;
  metadata: MarketMetadata;
  onSort: (field: SortField, direction: SortDirection) => void;
  onPage: (offset: number) => void;
  busy: boolean;
}) {
  return (
    <>
      <div className="data-table-wrap">
        <table className="data-table">
          <caption className="sr-only">
            Filtered market property records
          </caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = page.sort_by === column.key;
                const nextDirection =
                  active && page.sort_direction === "asc" ? "desc" : "asc";
                return (
                  <th scope="col" key={column.key}>
                    <button
                      className="sort-button"
                      onClick={() => onSort(column.key, nextDirection)}
                      aria-label={`Sort by ${column.label} ${nextDirection}`}
                    >
                      {column.label}
                      {active ? (
                        page.sort_direction === "asc" ? (
                          <ArrowUp size={13} aria-hidden="true" />
                        ) : (
                          <ArrowDown size={13} aria-hidden="true" />
                        )
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {page.records.map((record) => (
              <tr key={record.id}>
                <td className="mono">{record.id}</td>
                <td className="mono">
                  {formatNumber(record.square_footage)}{" "}
                  {fieldUnit(metadata, "square_footage")}
                </td>
                <td>{record.bedrooms}</td>
                <td>{record.bathrooms}</td>
                <td>{record.year_built}</td>
                <td className="mono">
                  {formatNumber(record.lot_size)}{" "}
                  {fieldUnit(metadata, "lot_size")}
                </td>
                <td className="mono">
                  {formatNumber(record.distance_to_city_center)}{" "}
                  {fieldUnit(metadata, "distance_to_city_center")}
                </td>
                <td>{record.school_rating}</td>
                <td className="mono">
                  {formatPrice(record.price, metadata.price.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="button-row"
        style={{ justifyContent: "space-between", marginTop: 18 }}
      >
        <span className="measure-label">
          {page.total === 0 ? 0 : page.offset + 1}–
          {Math.min(page.total, page.offset + page.records.length)} of{" "}
          {page.total}
        </span>
        <div className="button-row">
          <button
            className="button button-secondary"
            disabled={page.offset === 0 || busy}
            onClick={() => onPage(Math.max(0, page.offset - page.limit))}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <button
            className="button button-secondary"
            disabled={
              page.offset + page.limit >= page.total || busy
            }
            onClick={() => onPage(page.offset + page.limit)}
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
