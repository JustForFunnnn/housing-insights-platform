"use client";

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
      {FEATURE_KEYS.map((key) => {
        const definition = FIELD_DEFINITIONS[key];
        const field = metadata.features[key];
        const unit = fieldUnit(metadata, key);
        const registration = registerField(key);
        const errorId = `${registration.name}-error`;
        return (
          <div className="field" key={key}>
            <label htmlFor={registration.name}>
              {definition.label}
              {unit ? ` (${unit})` : ""}
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
        );
      })}
    </div>
  );
}
