"use client";

import type { FormEvent } from "react";

import type { MarketMetadata } from "@/api/types";
import { fieldUnit } from "@/lib/fields";
import { FILTER_KEYS } from "@/lib/market-query";

function RangeFields({
  label,
  minName,
  maxName,
  range,
  current,
  step = 1,
  unit = "",
}: {
  label: string;
  minName: string;
  maxName: string;
  range: { minimum: number; maximum: number };
  current: URLSearchParams;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="range-pair">
        <input
          className="input mono"
          name={minName}
          type="number"
          min={range.minimum}
          max={range.maximum}
          step={step}
          defaultValue={current.get(minName) ?? ""}
          aria-label={`Minimum ${label.toLowerCase()}`}
          placeholder={`Min ${range.minimum}`}
        />
        <span className="range-separator" aria-hidden="true">
          –
        </span>
        <input
          className="input mono"
          name={maxName}
          type="number"
          min={range.minimum}
          max={range.maximum}
          step={step}
          defaultValue={current.get(maxName) ?? ""}
          aria-label={`Maximum ${label.toLowerCase()}`}
          placeholder={`Max ${range.maximum}`}
        />
      </div>
      <span className="field-hint mono">
        Dataset {range.minimum} — {range.maximum}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

export function MarketFilters({
  metadata,
  current,
  onApply,
  onReset,
}: {
  metadata: MarketMetadata;
  current: URLSearchParams;
  onApply: (query: URLSearchParams) => void;
  onReset: () => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.dataset.export === "true") {
      return;
    }
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      for (const value of data.getAll(key)) {
        if (typeof value === "string" && value !== "") {
          query.append(key, value);
        }
      }
    }
    onApply(query);
  }

  const options = metadata.filter_options;
  return (
    <form id="market-filters" onSubmit={submit} key={current.toString()}>
      <input type="hidden" name="sort_by" value={current.get("sort_by") ?? "id"} />
      <input type="hidden" name="sort_direction" value={current.get("sort_direction") ?? "asc"} />
      <div className="form-grid">
        <RangeFields
          label="Interior area"
          minName="min_square_footage"
          maxName="max_square_footage"
          range={options.square_footage}
          current={current}
          unit={fieldUnit(metadata, "square_footage")}
        />
        <RangeFields
          label="Price"
          minName="min_price"
          maxName="max_price"
          range={options.price}
          current={current}
          unit={metadata.price_currency}
        />
        <fieldset className="field">
          <legend>Bedrooms</legend>
          <div className="checkbox-grid">
            {options.bedrooms.map((value) => (
              <label className="checkbox-option" key={value}>
                <input
                  type="checkbox"
                  name="bedrooms"
                  value={value}
                  defaultChecked={current.getAll("bedrooms").includes(String(value))}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>Bathrooms</legend>
          <div className="checkbox-grid">
            {options.bathrooms.map((value) => (
              <label className="checkbox-option" key={value}>
                <input
                  type="checkbox"
                  name="bathrooms"
                  value={value}
                  defaultChecked={current.getAll("bathrooms").includes(String(value))}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <details className="filter-details" style={{ marginTop: 20 }}>
        <summary>Advanced property ranges</summary>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <RangeFields
            label="Year built"
            minName="min_year_built"
            maxName="max_year_built"
            range={options.year_built}
            current={current}
          />
          <RangeFields
            label="Lot size"
            minName="min_lot_size"
            maxName="max_lot_size"
            range={options.lot_size}
            current={current}
            unit={fieldUnit(metadata, "lot_size")}
          />
          <RangeFields
            label="Distance to city center"
            minName="min_distance_to_city_center"
            maxName="max_distance_to_city_center"
            range={options.distance_to_city_center}
            current={current}
            step={0.1}
            unit={fieldUnit(metadata, "distance_to_city_center")}
          />
          <RangeFields
            label="School rating"
            minName="min_school_rating"
            maxName="max_school_rating"
            range={options.school_rating}
            current={current}
            step={0.1}
          />
        </div>
      </details>

      <div className="button-row" style={{ marginTop: 22 }}>
        <button className="button" type="submit">
          Apply segment
        </button>
        <button className="button button-secondary" type="button" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </form>
  );
}
