"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useFieldArray,
  useForm,
  type UseFormReturn,
} from "react-hook-form";

import { ErrorNotice } from "@/components/error-notice";
import { PropertyFields } from "@/components/property-fields";
import {
  FEATURE_KEYS,
  type FeatureKey,
  type MarketMetadata,
  type PropertyInput,
  type WhatIfRequest,
} from "@/api/types";
import {
  createWhatIfSchema,
  FIELD_DEFINITIONS,
  fieldErrorMessages,
  fieldStep,
  fieldUnit,
  MAX_WHAT_IF_SCENARIOS,
} from "@/lib/fields";
import {
  runWhatIf,
  toApiError,
} from "@/api/browser";
import { WhatIfResults } from "./what-if-results";

function marketExample(metadata: MarketMetadata): PropertyInput {
  const options = metadata.filter_options;
  const midpoint = (minimum: number, maximum: number) =>
    minimum + (maximum - minimum) * 0.45;
  return {
    square_footage: Math.round(
      midpoint(
        options.square_footage.minimum,
        options.square_footage.maximum,
      ),
    ),
    bedrooms:
      options.bedrooms[Math.min(1, options.bedrooms.length - 1)] ?? 0,
    bathrooms:
      options.bathrooms[Math.min(1, options.bathrooms.length - 1)] ?? 0,
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

function ScenarioEditor({
  form,
  metadata,
  index,
  canRemove,
  onRemove,
}: {
  form: UseFormReturn<WhatIfRequest>;
  metadata: MarketMetadata;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>(
    () => {
      const scenario =
        form.getValues(`scenarios.${index}` as const) ?? {};
      const existing = Object.keys(scenario).filter(
        (key): key is FeatureKey =>
          FEATURE_KEYS.includes(key as FeatureKey),
      );
      return existing.length > 0
        ? existing
        : [FEATURE_KEYS[index % FEATURE_KEYS.length]];
    },
  );
  const errors = fieldErrorMessages(
    form.formState.errors.scenarios?.[index] as
      | Partial<Record<FeatureKey, { message?: string }>>
      | undefined,
  );

  function replaceFeature(current: FeatureKey, next: FeatureKey) {
    if (current === next) return;
    form.unregister(`scenarios.${index}.${current}` as const);
    setSelectedFeatures((features) =>
      features.map((feature) =>
        feature === current ? next : feature,
      ),
    );
  }

  function addFeature() {
    const next = FEATURE_KEYS.find(
      (key) => !selectedFeatures.includes(key),
    );
    if (!next) return;
    setSelectedFeatures((features) => [...features, next]);
  }

  function removeFeature(feature: FeatureKey) {
    form.unregister(`scenarios.${index}.${feature}` as const);
    setSelectedFeatures((features) =>
      features.filter((key) => key !== feature),
    );
  }

  return (
    <section
      className="parcel parcel-pad"
      data-coordinate={`SCN / W-${String(index + 2).padStart(2, "0")}`}
    >
      <div className="scenario-heading">
        <div>
          <p className="measure-label">Feature overrides</p>
          <h2>Scenario {index + 1}</h2>
        </div>
        {canRemove ? (
          <button
            className="button button-danger"
            type="button"
            onClick={onRemove}
          >
            <Trash2 size={15} aria-hidden="true" />
            Remove scenario
          </button>
        ) : null}
      </div>

      <div className="scenario-intro">
        <p className="instrument-copy">
          Only listed values override the baseline.
        </p>
        <span className="scenario-change-count">
          {selectedFeatures.length} / {FEATURE_KEYS.length} features
        </span>
      </div>
      <div className="scenario-change-list">
        <div className="scenario-change-header" aria-hidden="true">
          <span>Feature</span>
          <span>Value</span>
          <span />
        </div>
        {selectedFeatures.map((key, changeIndex) => {
          const definition = FIELD_DEFINITIONS[key];
          const field = metadata.features[key];
          const unit = fieldUnit(metadata, key);
          const registration = form.register(
            `scenarios.${index}.${key}` as const,
            { valueAsNumber: true },
          );
          const errorId = `${registration.name}-error`;
          return (
            <div className="scenario-change-row" key={key}>
              <div className="field scenario-change-feature">
                <label
                  className="sr-only"
                  htmlFor={`scenario-${index}-${key}-feature`}
                >
                  Scenario {index + 1} feature {changeIndex + 1}
                </label>
                <select
                  className="input"
                  id={`scenario-${index}-${key}-feature`}
                  value={key}
                  onChange={(event) =>
                    replaceFeature(
                      key,
                      event.target.value as FeatureKey,
                    )
                  }
                  aria-label={`Scenario ${index + 1} feature ${changeIndex + 1}`}
                >
                  {FEATURE_KEYS.filter(
                    (option) =>
                      option === key ||
                      !selectedFeatures.includes(option),
                  ).map((option) => (
                    <option value={option} key={option}>
                      {FIELD_DEFINITIONS[option].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field scenario-change-value">
                <label className="sr-only" htmlFor={registration.name}>
                  New {definition.label.toLowerCase()} for scenario{" "}
                  {index + 1}
                </label>
                <input
                  {...registration}
                  id={registration.name}
                  className="input mono"
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={fieldStep(key)}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? errorId : undefined}
                />
                <span className="field-hint mono">
                  {field.min} — {field.max}
                  {unit ? ` ${unit}` : ""}
                </span>
                {errors[key] ? (
                  <span className="field-error" id={errorId}>
                    {errors[key]}
                  </span>
                ) : null}
              </div>

              {selectedFeatures.length > 1 ? (
                <button
                  className="button button-danger scenario-change-remove"
                  type="button"
                  onClick={() => removeFeature(key)}
                  aria-label={`Remove ${definition.label} from scenario ${index + 1}`}
                  title={`Remove ${definition.label}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              ) : (
                <span
                  className="scenario-change-end"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        className="button button-secondary"
        type="button"
        disabled={selectedFeatures.length >= FEATURE_KEYS.length}
        onClick={addFeature}
      >
        <Plus size={16} aria-hidden="true" />
        Add feature
      </button>
    </section>
  );
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
      scenarios: [{}],
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
            <ScenarioEditor
              key={scenario.id}
              form={form}
              metadata={metadata}
              index={index}
              canRemove={scenarios.fields.length > 1}
              onRemove={() => scenarios.remove(index)}
            />
          ))}
        </div>

        <div className="button-row" style={{ marginTop: 22 }}>
          <button
            className="button button-secondary"
            type="button"
            disabled={
              scenarios.fields.length >= MAX_WHAT_IF_SCENARIOS
            }
            onClick={() => scenarios.append({})}
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
