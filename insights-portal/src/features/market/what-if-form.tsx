"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { ErrorNotice } from "@/components/error-notice";
import { EstimateChart } from "@/components/estimate-chart";
import { PropertyFields } from "@/components/property-fields";
import {
  FEATURE_KEYS,
  type FeatureKey,
  type MarketMetadata,
  type PropertyInput,
  type WhatIfResponse,
} from "@/lib/api/types";
import {
  errorResponse,
  portalFetch,
} from "@/lib/browser-api";
import { createWhatIfSchema } from "@/lib/fields";
import { formatPrice } from "@/lib/format";

import { DifferenceChart } from "./difference-chart";

interface WhatIfValues {
  baseline: PropertyInput;
  scenarios: PropertyInput[];
}

function marketExample(
  metadata: MarketMetadata,
  variant = 0,
): PropertyInput {
  const options = metadata.filter_options;
  const midpoint = (minimum: number, maximum: number) =>
    minimum + (maximum - minimum) * (variant ? 0.62 : 0.45);
  return {
    square_footage: Math.round(
      midpoint(
        options.square_footage.minimum,
        options.square_footage.maximum,
      ),
    ),
    bedrooms:
      options.bedrooms[
        Math.min(variant + 1, options.bedrooms.length - 1)
      ] ?? 0,
    bathrooms:
      options.bathrooms[
        Math.min(variant + 1, options.bathrooms.length - 1)
      ] ?? 0,
    year_built: Math.round(
      midpoint(options.year_built.minimum, options.year_built.maximum),
    ),
    lot_size: Math.round(
      midpoint(options.lot_size.minimum, options.lot_size.maximum),
    ),
    distance_to_city_center: Number(
      midpoint(
        options.distance_to_city_center.minimum,
        options.distance_to_city_center.maximum,
      ).toFixed(1),
    ),
    school_rating: Number(
      midpoint(
        options.school_rating.minimum,
        options.school_rating.maximum,
      ).toFixed(1),
    ),
  };
}

export function WhatIfForm({
  initialMetadata,
}: {
  initialMetadata: MarketMetadata;
}) {
  const metadataQuery = useQuery({
    queryKey: ["market-metadata"],
    queryFn: () =>
      portalFetch<MarketMetadata>("/api/market/metadata"),
    initialData: initialMetadata,
    staleTime: 300_000,
  });
  const metadata = metadataQuery.data;
  const form = useForm<WhatIfValues>({
    resolver: zodResolver(createWhatIfSchema(metadata)),
    defaultValues: {
      baseline: marketExample(metadata),
      scenarios: [marketExample(metadata, 1)],
    },
  });
  const scenarios = useFieldArray({
    control: form.control,
    name: "scenarios",
  });
  const whatIf = useMutation({
    mutationFn: (payload: WhatIfValues) =>
      portalFetch<WhatIfResponse>("/api/market/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  });

  function errorMap(
    errors:
      | Record<string, { message?: string } | undefined>
      | undefined,
  ) {
    return Object.fromEntries(
      FEATURE_KEYS.map((key) => [key, errors?.[key]?.message]),
    ) as Partial<Record<FeatureKey, string>>;
  }

  return (
    <>
      <form
        onSubmit={form.handleSubmit((values) => whatIf.mutate(values))}
        noValidate
      >
        <div className="scenario-stack">
          <section
            className="parcel parcel-pad"
            data-coordinate="BASE / W-01"
          >
            <div className="scenario-heading">
              <div>
                <p className="measure-label">Reference parcel</p>
                <h2>Baseline property</h2>
              </div>
            </div>
            <PropertyFields
              metadata={metadata}
              registerField={(key) =>
                form.register(`baseline.${key}` as const, {
                  valueAsNumber: true,
                })
              }
              errors={errorMap(
                form.formState.errors.baseline as
                  | Record<string, { message?: string }>
                  | undefined,
              )}
            />
          </section>

          {scenarios.fields.map((scenario, index) => (
            <section
              className="parcel parcel-pad"
              key={scenario.id}
              data-coordinate={`SCN / W-${String(index + 2).padStart(2, "0")}`}
            >
              <div className="scenario-heading">
                <div>
                  <p className="measure-label">Alternative parcel</p>
                  <h2>Scenario {index + 1}</h2>
                </div>
                <button
                  className="button button-danger"
                  type="button"
                  disabled={scenarios.fields.length === 1}
                  onClick={() => scenarios.remove(index)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Remove
                </button>
              </div>
              <PropertyFields
                metadata={metadata}
                registerField={(key) =>
                  form.register(`scenarios.${index}.${key}` as const, {
                    valueAsNumber: true,
                  })
                }
                errors={errorMap(
                  form.formState.errors.scenarios?.[index] as
                    | Record<string, { message?: string }>
                    | undefined,
                )}
              />
            </section>
          ))}
        </div>

        <div className="button-row" style={{ marginTop: 22 }}>
          <button
            className="button button-secondary"
            type="button"
            disabled={scenarios.fields.length >= 4}
            onClick={() =>
              scenarios.append(
                marketExample(metadata, scenarios.fields.length % 2),
              )
            }
          >
            <Plus size={16} aria-hidden="true" />
            Add scenario
          </button>
          <button
            className="button"
            type="submit"
            disabled={whatIf.isPending}
          >
            {whatIf.isPending ? "Calculating…" : "Run what-if"}
          </button>
        </div>
      </form>

      {whatIf.isError ? (
        <div style={{ marginTop: 24 }}>
          <ErrorNotice
            error={errorResponse(whatIf.error)}
            onRetry={() =>
              form.handleSubmit((value) => whatIf.mutate(value))()
            }
          />
        </div>
      ) : null}

      {whatIf.data ? (
        <section style={{ marginTop: 34 }}>
          <p className="measure-label">Scenario readings</p>
          <h2 className="instrument-title">Change from baseline</h2>
          <EstimateChart
            unit={metadata.price_currency}
            values={[
              {
                label: "Baseline",
                value: whatIf.data.baseline_prediction,
              },
              ...whatIf.data.scenarios.map((scenario, index) => ({
                label: `Scenario ${index + 1}`,
                value: scenario.predicted_price,
              })),
            ]}
          />
          <h3 className="instrument-title" style={{ marginTop: 28 }}>
            Difference from baseline
          </h3>
          <DifferenceChart
            unit={metadata.price_currency}
            values={whatIf.data.scenarios.map((scenario, index) => ({
              label: `Scenario ${index + 1}`,
              value: scenario.price_difference,
            }))}
          />
          <div className="data-table-wrap" style={{ marginTop: 22 }}>
            <table className="data-table">
              <caption className="sr-only">
                What-if scenario results
              </caption>
              <thead>
                <tr>
                  <th scope="col">Scenario</th>
                  <th scope="col">Predicted price</th>
                  <th scope="col">Absolute change</th>
                  <th scope="col">Percentage change</th>
                </tr>
              </thead>
              <tbody>
                {whatIf.data.scenarios.map((scenario, index) => (
                  <tr key={index}>
                    <th scope="row">Scenario {index + 1}</th>
                    <td className="mono">
                      {formatPrice(
                        scenario.predicted_price,
                        metadata.price_currency,
                      )}
                    </td>
                    <td className="mono">
                      {scenario.price_difference >= 0 ? "+" : ""}
                      {formatPrice(
                        scenario.price_difference,
                        metadata.price_currency,
                      )}
                    </td>
                    <td className="mono">
                      {scenario.percentage_difference >= 0 ? "+" : ""}
                      {scenario.percentage_difference.toFixed(2)}%
                    </td>
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
