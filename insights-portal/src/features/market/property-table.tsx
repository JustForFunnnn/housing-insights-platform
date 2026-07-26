"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import { Pagination } from "@/components/pagination";
import type { MarketMetadata, PropertyPage, SortDirection, SortField } from "@/api/types";
import { fieldUnit, PROPERTY_TABLE_COLUMNS } from "@/lib/fields";
import { formatNumber, formatPrice } from "@/lib/format";
import { whatIfHref } from "@/lib/market-query";

const columns: Array<{ key: SortField; label: string }> = [
  { key: "id", label: "ID" },
  ...PROPERTY_TABLE_COLUMNS,
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
          <caption className="sr-only">Filtered market property records</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = page.sort_by === column.key;
                const nextDirection = active && page.sort_direction === "asc" ? "desc" : "asc";
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
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {page.records.map((record) => (
              <tr key={record.id}>
                <td className="mono">{record.id}</td>
                <td className="mono">
                  {formatNumber(record.square_footage)} {fieldUnit(metadata, "square_footage")}
                </td>
                <td>{record.bedrooms}</td>
                <td>{record.bathrooms}</td>
                <td>{record.year_built}</td>
                <td className="mono">
                  {formatNumber(record.lot_size)} {fieldUnit(metadata, "lot_size")}
                </td>
                <td className="mono">
                  {formatNumber(record.distance_to_city_center)} {fieldUnit(metadata, "distance_to_city_center")}
                </td>
                <td>{record.school_rating}</td>
                <td className="mono">{formatPrice(record.price, metadata.price_currency)}</td>
                <td>
                  <Link
                    className="button table-action"
                    href={whatIfHref(record)}
                    aria-label={`Use property ${record.id} as the what-if baseline`}
                  >
                    What-if
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        offset={page.offset}
        limit={page.limit}
        itemCount={page.records.length}
        total={page.total}
        busy={busy}
        onPage={onPage}
      />
    </>
  );
}
