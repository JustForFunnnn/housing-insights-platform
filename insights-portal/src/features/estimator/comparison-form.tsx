"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { ErrorNotice } from "@/components/error-notice";
import { EstimateChart } from "@/components/estimate-chart";
import { PropertyFields } from "@/components/property-fields";
import {
  FEATURE_KEYS,
  type EstimateBatch,
  type FeatureKey,
  type PropertyInput,
  type PropertyMetadata,
} from "@/lib/api/types";
import {
  errorResponse,
  portalFetch,
} from "@/lib/browser-api";
import {
  FIELD_DEFINITIONS,
  createComparisonSchema,
  exampleProperty,
} from "@/lib/fields";
import { formatNumber, formatPrice } from "@/lib/format";

interface ComparisonValues {
  properties: PropertyInput[];
}

export function ComparisonForm({
  metadata,
}: {
  metadata: PropertyMetadata;
}) {
  const form = useForm<ComparisonValues>({
    resolver: zodResolver(createComparisonSchema(metadata)),
    defaultValues: {
      properties: [
        exampleProperty(metadata),
        {
          ...exampleProperty(metadata),
          square_footage: 2100,
          bedrooms: 4,
        },
      ],
    },
  });
  const fields = useFieldArray({
    control: form.control,
    name: "properties",
  });
  const comparison = useMutation({
    mutationFn: (properties: PropertyInput[]) =>
      portalFetch<EstimateBatch>("/api/estimator/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties }),
      }),
  });
  const estimates = comparison.data?.estimates ?? [];
  const ranked = estimates
    .map((record, index) => ({
      label: `Property ${String.fromCharCode(65 + index)}`,
      value: record.estimated_price,
    }))
    .sort((a, b) => a.value - b.value);
  const lowest = ranked.at(0);
  const highest = ranked.at(-1);

  return (
    <>
      <form
        onSubmit={form.handleSubmit((value) =>
          comparison.mutate(value.properties),
        )}
        noValidate
      >
        <div className="scenario-stack">
          {fields.fields.map((field, index) => {
            const propertyErrors =
              form.formState.errors.properties?.[index];
            const errorMap = Object.fromEntries(
              FEATURE_KEYS.map((key) => [
                key,
                propertyErrors?.[key]?.message,
              ]),
            ) as Partial<Record<FeatureKey, string>>;
            return (
              <section
                className="parcel parcel-pad"
                key={field.id}
                data-coordinate={`CMP / ${String.fromCharCode(65 + index)}`}
              >
                <div className="scenario-heading">
                  <div>
                    <p className="measure-label">Comparison parcel</p>
                    <h2>Property {String.fromCharCode(65 + index)}</h2>
                  </div>
                  <button
                    className="button button-danger"
                    type="button"
                    disabled={fields.fields.length <= 2}
                    onClick={() => fields.remove(index)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <PropertyFields
                  metadata={metadata}
                  registerField={(key) =>
                    form.register(
                      `properties.${index}.${key}` as const,
                      { valueAsNumber: true },
                    )
                  }
                  errors={errorMap}
                />
              </section>
            );
          })}
        </div>

        <div className="button-row" style={{ marginTop: 22 }}>
          <button
            className="button button-secondary"
            type="button"
            disabled={fields.fields.length >= 4}
            onClick={() => fields.append(exampleProperty(metadata))}
          >
            <Plus size={16} aria-hidden="true" />
            Add property
          </button>
          <button
            className="button"
            type="submit"
            disabled={comparison.isPending}
          >
            {comparison.isPending ? "Comparing…" : "Compare values"}
          </button>
        </div>
      </form>

      {comparison.isError ? (
        <div style={{ marginTop: 22 }}>
          <ErrorNotice
            error={errorResponse(comparison.error)}
            onRetry={() =>
              form.handleSubmit((value) =>
                comparison.mutate(value.properties),
              )()
            }
          />
        </div>
      ) : null}

      {comparison.data ? (
        <section style={{ marginTop: 34 }}>
          <p className="measure-label">Comparative reading</p>
          <h2 className="instrument-title">Values on one scale</h2>
          {lowest && highest ? (
            <div className="metric-grid" style={{ margin: "22px 0" }}>
              <div className="metric">
                <span className="measure-label">Highest · {highest.label}</span>
                <strong className="metric-value">
                  {formatPrice(highest.value, metadata.price_currency)}
                </strong>
              </div>
              <div className="metric">
                <span className="measure-label">Lowest · {lowest.label}</span>
                <strong className="metric-value">
                  {formatPrice(lowest.value, metadata.price_currency)}
                </strong>
              </div>
              <div className="metric">
                <span className="measure-label">Value spread</span>
                <strong className="metric-value">
                  {formatPrice(
                    highest.value - lowest.value,
                    metadata.price_currency,
                  )}
                </strong>
              </div>
            </div>
          ) : null}
          <EstimateChart
            unit={metadata.price_currency}
            values={comparison.data.estimates.map((record, index) => ({
              label: `Property ${String.fromCharCode(65 + index)}`,
              value: record.estimated_price,
            }))}
          />
          <div className="data-table-wrap" style={{ marginTop: 24 }}>
            <table className="data-table">
              <caption className="sr-only">
                Side-by-side property comparison
              </caption>
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  {comparison.data.estimates.map((_, index) => (
                    <th scope="col" key={index}>
                      Property {String.fromCharCode(65 + index)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Estimated price</th>
                  {comparison.data.estimates.map((record) => (
                    <td className="mono" key={record.created_at}>
                      {formatPrice(
                        record.estimated_price,
                        metadata.price_currency,
                      )}
                    </td>
                  ))}
                </tr>
                {FEATURE_KEYS.map((key) => (
                  <tr key={key}>
                    <th scope="row">{FIELD_DEFINITIONS[key].label}</th>
                    {comparison.data.estimates.map((record) => (
                      <td
                        className="mono"
                        key={`${record.created_at}-${key}`}
                      >
                        {formatNumber(record.property[key])}
                        {metadata.features[key].unit
                          ? ` ${metadata.features[key].unit}`
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
