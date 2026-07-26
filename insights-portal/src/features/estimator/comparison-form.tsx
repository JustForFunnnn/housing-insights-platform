"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { ErrorNotice } from "@/components/error-notice";
import { PropertyFields } from "@/components/property-fields";
import {
  type PropertyInput,
  type PropertyMetadata,
} from "@/api/types";
import {
  createComparisonSchema,
  exampleProperty,
  fieldErrorMessages,
} from "@/lib/fields";
import {
  createEstimates,
  toApiError,
} from "@/api/browser";

import { ComparisonResults } from "./comparison-results";

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
    mutationFn: createEstimates,
  });

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
                  errors={fieldErrorMessages(propertyErrors)}
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
            error={toApiError(comparison.error)}
            onRetry={() =>
              form.handleSubmit((value) =>
                comparison.mutate(value.properties),
              )()
            }
          />
        </div>
      ) : null}

      {comparison.data ? (
        <ComparisonResults
          result={comparison.data}
          metadata={metadata}
        />
      ) : null}
    </>
  );
}
