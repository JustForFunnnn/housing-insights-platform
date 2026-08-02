"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import { Pagination } from "@/components/pagination";
import type { MarketMetadataResponse, PropertyPageResponse, SortDirection, SortField } from "@/api/types";
import { fieldUnit, PROPERTY_TABLE_COLUMNS } from "@/lib/fields";
import { formatNumber, formatPrice } from "@/lib/format";
import { whatIfHref } from "@/lib/market-query";

const columns: Array<{ key: SortField; label: string }> = [
  { key: "id", label: "ID" },
  ...PROPERTY_TABLE_COLUMNS,
  { key: "price", label: "Price" },
];

export function PropertyTable({
  propertyPage,
  metadata,
  onSort,
  onPage,
  busy,
}: {
  propertyPage: PropertyPageResponse;
  metadata: MarketMetadataResponse;
  onSort: (field: SortField, direction: SortDirection) => void;
  onPage: (offset: number) => void;
  busy: boolean;
}) {
  return (
    <>
      <div className="data-table-wrap">
        <table className="data-table">
          <caption className="sr-only">Filtered market properties</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = propertyPage.sort_by === column.key;
                const nextDirection = active && propertyPage.sort_direction === "asc" ? "desc" : "asc";
                return (
                  <th scope="col" key={column.key}>
                    <button
                      className="sort-button"
                      onClick={() => onSort(column.key, nextDirection)}
                      aria-label={`Sort by ${column.label} ${nextDirection}`}
                    >
                      {column.label}
                      {active ? (
                        propertyPage.sort_direction === "asc" ? (
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
            {propertyPage.properties.map((property) => (
              <tr key={property.id}>
                <td className="mono">{property.id}</td>
                <td className="mono">
                  {formatNumber(property.square_footage)} {fieldUnit(metadata, "square_footage")}
                </td>
                <td>{property.bedrooms}</td>
                <td>{property.bathrooms}</td>
                <td>{property.year_built}</td>
                <td className="mono">
                  {formatNumber(property.lot_size)} {fieldUnit(metadata, "lot_size")}
                </td>
                <td className="mono">
                  {formatNumber(property.distance_to_city_center)} {fieldUnit(metadata, "distance_to_city_center")}
                </td>
                <td>{property.school_rating}</td>
                <td className="mono">{formatPrice(property.price, metadata.price_currency)}</td>
                <td>
                  <Link
                    className="button table-action"
                    href={whatIfHref(property)}
                    aria-label={`Use property ${property.id} as the what-if baseline`}
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
        offset={propertyPage.offset}
        limit={propertyPage.limit}
        itemCount={propertyPage.properties.length}
        total={propertyPage.total}
        busy={busy}
        onPage={onPage}
      />
    </>
  );
}
