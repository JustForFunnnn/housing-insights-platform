import { z } from "zod";

import { FEATURE_KEYS, type FeatureKey, type PropertyInput, type PropertyMetadata } from "@/api/types";

export const MAX_WHAT_IF_SCENARIOS = 7;

const PROPERTY_NUMBER_KINDS = {
  square_footage: "number",
  bedrooms: "integer",
  bathrooms: "number",
  year_built: "integer",
  lot_size: "number",
  distance_to_city_center: "number",
  school_rating: "number",
} as const satisfies Record<FeatureKey, "integer" | "number">;

export const FIELD_DEFINITIONS: Record<FeatureKey, { label: string }> = {
  square_footage: { label: "Interior area" },
  bedrooms: { label: "Bedrooms" },
  bathrooms: { label: "Bathrooms" },
  year_built: { label: "Year built" },
  lot_size: { label: "Lot size" },
  distance_to_city_center: { label: "Distance to city center" },
  school_rating: { label: "School rating" },
};

export const PROPERTY_TABLE_COLUMNS = [
  { key: "square_footage", label: "Area" },
  { key: "bedrooms", label: "Beds" },
  { key: "bathrooms", label: "Baths" },
  { key: "year_built", label: "Year" },
  { key: "lot_size", label: "Lot" },
  { key: "distance_to_city_center", label: "Distance" },
  { key: "school_rating", label: "School" },
] as const satisfies ReadonlyArray<{
  key: FeatureKey;
  label: string;
}>;

export function fieldErrorMessages(errors: Partial<Record<FeatureKey, { message?: string }>> | undefined) {
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, errors?.[key]?.message])) as Partial<
    Record<FeatureKey, string>
  >;
}

function propertyNumber(metadata: PropertyMetadata, key: FeatureKey) {
  const field = metadata.features[key];
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
    Object.fromEntries(FEATURE_KEYS.map((key) => [key, propertyNumber(metadata, key)])) as Record<
      FeatureKey,
      ReturnType<typeof propertyNumber>
    >,
  );
}

export function propertyFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  metadata: PropertyMetadata,
) {
  const candidate = Object.fromEntries(
    FEATURE_KEYS.map((key) => {
      const value = searchParams[key];
      return [key, typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN];
    }),
  );
  const result = createPropertySchema(metadata).safeParse(candidate);
  return result.success ? result.data : undefined;
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
  const scenario = z
    .object(
      Object.fromEntries(FEATURE_KEYS.map((key) => [key, propertyNumber(metadata, key).optional()])) as Record<
        FeatureKey,
        z.ZodOptional<ReturnType<typeof propertyNumber>>
      >,
    )
    .strict()
    .refine((value) => FEATURE_KEYS.some((key) => value[key] !== undefined), "Change at least one feature.");

  return z.object({
    baseline: createPropertySchema(metadata),
    scenarios: z
      .array(scenario)
      .min(1, "Add at least one scenario.")
      .max(MAX_WHAT_IF_SCENARIOS, `Add no more than ${MAX_WHAT_IF_SCENARIOS} scenarios.`),
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

  function clamp(key: FeatureKey) {
    const { min, max } = metadata.features[key];
    return Math.min(max, Math.max(min, examples[key]));
  }

  return {
    square_footage: clamp("square_footage"),
    bedrooms: clamp("bedrooms"),
    bathrooms: clamp("bathrooms"),
    year_built: clamp("year_built"),
    lot_size: clamp("lot_size"),
    distance_to_city_center: clamp("distance_to_city_center"),
    school_rating: clamp("school_rating"),
  };
}

export function fieldUnit(metadata: PropertyMetadata, key: FeatureKey) {
  const unit = metadata.features[key].unit;
  if (!unit) return "";
  if (unit === "sq_ft") return "sq ft";
  if (unit === "mi") return "mi";
  if (unit === "year") return "";
  return unit;
}
