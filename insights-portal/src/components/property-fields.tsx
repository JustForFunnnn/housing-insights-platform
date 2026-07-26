"use client";

import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import {
  FIELD_DEFINITIONS,
  fieldStep,
  fieldUnit,
} from "@/lib/fields";
import {
  FEATURE_KEYS,
  type FeatureKey,
  type PropertyMetadata,
} from "@/api/types";

export function FeatureNumberInput({
  feature,
  metadata,
  registration,
  error,
  label,
  className = "field",
  labelClassName,
}: {
  feature: FeatureKey;
  metadata: PropertyMetadata;
  registration: UseFormRegisterReturn;
  error?: string;
  label?: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  const definition = FIELD_DEFINITIONS[feature];
  const field = metadata.features[feature];
  const unit = fieldUnit(metadata, feature);
  const errorId = `${registration.name}-error`;

  return (
    <div className={className}>
      <label className={labelClassName} htmlFor={registration.name}>
        {label ?? (
          <>
            {definition.label}
            {unit ? ` (${unit})` : ""}
          </>
        )}
      </label>
      <input
        {...registration}
        id={registration.name}
        className="input mono"
        type="number"
        min={field.min}
        max={field.max}
        step={fieldStep(feature)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      <span className="field-hint mono">
        {field.min} — {field.max}
        {unit ? ` ${unit}` : ""}
      </span>
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function PropertyFields({
  metadata,
  registerField,
  errors = {},
}: {
  metadata: PropertyMetadata;
  registerField: (key: FeatureKey) => UseFormRegisterReturn;
  errors?: Partial<Record<FeatureKey, string>>;
}) {
  return (
    <div className="form-grid">
      {FEATURE_KEYS.map((feature) => (
        <FeatureNumberInput
          key={feature}
          feature={feature}
          metadata={metadata}
          registration={registerField(feature)}
          error={errors[feature]}
        />
      ))}
    </div>
  );
}
