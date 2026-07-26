"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { ErrorNotice } from "@/components/error-notice";
import { PropertyFields } from "@/components/property-fields";
import {
  type MarketMetadata,
  type PropertyInput,
  type WhatIfRequest,
} from "@/api/types";
import {
  createWhatIfSchema,
  fieldErrorMessages,
} from "@/lib/fields";
import {
  runWhatIf,
  toApiError,
} from "@/api/browser";
import { WhatIfResults } from "./what-if-results";

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
  initialBaseline,
}: {
  initialMetadata: MarketMetadata;
  initialBaseline?: PropertyInput;
}) {
  const metadata = initialMetadata;
  const form = useForm<WhatIfRequest>({
    resolver: zodResolver(createWhatIfSchema(metadata)),
    defaultValues: {
      baseline: initialBaseline ?? marketExample(metadata),
      scenarios: [marketExample(metadata, 1)],
    },
  });
  const scenarios = useFieldArray({
    control: form.control,
    name: "scenarios",
  });
  const whatIf = useMutation({
    mutationFn: runWhatIf,
  });

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
              errors={fieldErrorMessages(
                form.formState.errors.baseline,
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
                errors={fieldErrorMessages(
                  form.formState.errors.scenarios?.[index],
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
            error={toApiError(whatIf.error)}
            onRetry={() =>
              form.handleSubmit((value) => whatIf.mutate(value))()
            }
          />
        </div>
      ) : null}

      {whatIf.data ? (
        <WhatIfResults
          result={whatIf.data}
          priceCurrency={metadata.price_currency}
        />
      ) : null}
    </>
  );
}
