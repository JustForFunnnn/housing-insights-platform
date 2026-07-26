import { z } from "zod";

import {
  FEATURE_KEYS,
  type FeatureKey,
  type PropertyInput,
  type PropertyMetadata,
} from "@/lib/api/types";
import { PROPERTY_NUMBER_KINDS } from "@/lib/api/generated/property-number-kinds";

export const FIELD_DEFINITIONS: Record<
  FeatureKey,
  { label: string }
> = {
  square_footage: { label: "Interior area" },
  bedrooms: { label: "Bedrooms" },
  bathrooms: { label: "Bathrooms" },
  year_built: { label: "Year built" },
  lot_size: { label: "Lot size" },
  distance_to_city_center: { label: "Distance to city center" },
  school_rating: { label: "School rating" },
};

function propertyNumber(
  metadata: PropertyMetadata,
  key: FeatureKey,
) {
  const field = metadata.fields[key];
  const definition = FIELD_DEFINITIONS[key];
  let schema = z
    .number({
      error: `${definition.label} is required.`,
    })
    .finite(`${definition.label} must be a finite number.`)
    .min(field.min, `${definition.label} must be at least ${field.min}.`)
    .max(field.max, `${definition.label} must be at most ${field.max}.`);

  if (PROPERTY_NUMBER_KINDS[key] === "integer") {
    schema = schema.refine(Number.isInteger, {
      message: `${definition.label} must be a whole number.`,
    });
  }
  return schema;
}

export function fieldStep(key: FeatureKey) {
  return PROPERTY_NUMBER_KINDS[key] === "integer" ? 1 : "any";
}

export function createPropertySchema(metadata: PropertyMetadata) {
  return z.object(
    Object.fromEntries(
      FEATURE_KEYS.map((key) => [key, propertyNumber(metadata, key)]),
    ) as Record<FeatureKey, ReturnType<typeof propertyNumber>>,
  );
}

export function createComparisonSchema(metadata: PropertyMetadata) {
  return z.object({
    properties: z
      .array(createPropertySchema(metadata))
      .min(2, "Compare at least two properties.")
      .max(4, "Compare no more than four properties."),
  });
}

export function createWhatIfSchema(metadata: PropertyMetadata) {
  return z.object({
    baseline: createPropertySchema(metadata),
    scenarios: z
      .array(createPropertySchema(metadata))
      .min(1, "Add at least one scenario.")
      .max(4, "Add no more than four scenarios."),
  });
}

export function exampleProperty(metadata: PropertyMetadata): PropertyInput {
  const examples: PropertyInput = {
    square_footage: 1850,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1998,
    lot_size: 7500,
    distance_to_city_center: 5.6,
    school_rating: 8.2,
  };

  return Object.fromEntries(
    FEATURE_KEYS.map((key) => {
      const { min, max } = metadata.fields[key];
      return [key, Math.min(max, Math.max(min, examples[key]))];
    }),
  ) as unknown as PropertyInput;
}

export function fieldUnit(
  metadata: PropertyMetadata,
  key: FeatureKey,
) {
  const unit = metadata.fields[key].unit;
  if (!unit) return "";
  if (unit === "sq_ft") return "sq ft";
  if (unit === "mi") return "mi";
  if (unit === "year") return "";
  return unit;
}
