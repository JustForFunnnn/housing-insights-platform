"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";

import { ErrorNotice } from "@/components/error-notice";
import { EstimateChart } from "@/components/estimate-chart";
import { PropertyFields } from "@/components/property-fields";
import type { PropertyInput, PropertyMetadata } from "@/api/types";
import { createPropertySchema, exampleProperty, fieldErrorMessages } from "@/lib/fields";
import { formatDate, formatPrice } from "@/lib/format";
import { createEstimates, toApiError } from "@/api/browser";

export function EstimatorForm({ initialMetadata }: { initialMetadata: PropertyMetadata }) {
  const metadata = initialMetadata;
  const form = useForm<PropertyInput>({
    resolver: zodResolver(createPropertySchema(metadata)),
    defaultValues: exampleProperty(metadata),
  });
  const estimate = useMutation({
    mutationFn: (property: PropertyInput) => createEstimates([property]),
  });

  const result = estimate.data?.estimates[0];
  const errors = fieldErrorMessages(form.formState.errors);

  return (
    <div className="parcel-grid">
      <section className="parcel parcel-span-7 parcel-pad" data-coordinate="INPUT / A-12">
        <p className="measure-label">Property field sheet</p>
        <h2 className="instrument-title">Describe the property</h2>
        <p className="instrument-copy" style={{ marginBottom: 24 }}>
          Every range and unit below comes from the estimator metadata contract.
        </p>
        <form onSubmit={form.handleSubmit((value) => estimate.mutate(value))} noValidate>
          <PropertyFields
            metadata={metadata}
            registerField={(key) => form.register(key, { valueAsNumber: true })}
            errors={errors}
          />
          <div className="button-row" style={{ marginTop: 26 }}>
            <button className="button" type="submit" disabled={estimate.isPending}>
              {estimate.isPending ? "Estimating…" : "Estimate value"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                form.reset(exampleProperty(metadata));
                estimate.reset();
              }}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="parcel parcel-span-5 parcel-pad" data-coordinate="RESULT / B-12" aria-live="polite">
        <p className="measure-label">Model reading</p>
        <h2 className="instrument-title">Estimated value</h2>
        {estimate.isError ? (
          <ErrorNotice
            error={toApiError(estimate.error)}
            onRetry={() => form.handleSubmit((v) => estimate.mutate(v))()}
          />
        ) : result ? (
          <>
            <strong className="metric-value" style={{ fontSize: "2.2rem" }}>
              {formatPrice(result.estimated_price, metadata.price_currency)}
            </strong>
            <EstimateChart
              values={[
                {
                  label: "Estimate",
                  value: result.estimated_price,
                },
              ]}
              unit={metadata.price_currency}
            />
            <p className="estimate-time">
              <span className="measure-label">Time</span>
              <time dateTime={result.created_at}>{formatDate(result.created_at)}</time>
            </p>
          </>
        ) : (
          <div className="empty-state">
            <h2>No reading yet</h2>
            <p>Complete the field sheet and run an estimate to plot the result.</p>
          </div>
        )}
      </section>
    </div>
  );
}
