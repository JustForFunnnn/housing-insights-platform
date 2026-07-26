import { describe, expect, it } from "vitest";

import type { PropertyMetadata } from "@/api/types";
import {
  createComparisonSchema,
  createPropertySchema,
  createWhatIfSchema,
  exampleProperty,
  fieldStep,
  fieldUnit,
  propertyFromSearchParams,
} from "@/lib/fields";

const metadata: PropertyMetadata = {
  features: {
    square_footage: { min: 1, max: 100000, unit: "sq_ft" },
    bedrooms: { min: 0, max: 100, unit: null },
    bathrooms: { min: 0, max: 100, unit: null },
    year_built: { min: 1800, max: 2026, unit: "year" },
    lot_size: { min: 1, max: 100000, unit: "sq_ft" },
    distance_to_city_center: { min: 0, max: 400, unit: "mi" },
    school_rating: { min: 0, max: 10, unit: null },
  },
  price_currency: "USD",
};

describe("metadata-driven property validation", () => {
  it("accepts the example and uses display units", () => {
    expect(
      createPropertySchema(metadata).safeParse(exampleProperty(metadata))
        .success,
    ).toBe(true);
    expect(fieldUnit(metadata, "square_footage")).toBe("sq ft");
    expect(fieldUnit(metadata, "distance_to_city_center")).toBe("mi");
    expect(fieldStep("bedrooms")).toBe(1);
    expect(fieldStep("bathrooms")).toBe("any");
  });

  it.each([
    ["empty", Number.NaN],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["below minimum", -1],
    ["above maximum", 101],
  ])("rejects %s numeric input", (_, bedrooms) => {
    expect(
      createPropertySchema(metadata).safeParse({
        ...exampleProperty(metadata),
        bedrooms,
      }).success,
    ).toBe(false);
  });

  it("rejects metadata range violations and OpenAPI integer violations", () => {
    const example = exampleProperty(metadata);
    expect(
      createPropertySchema(metadata).safeParse({
        ...example,
        school_rating: 11,
      }).success,
    ).toBe(false);
    expect(
      createPropertySchema(metadata).safeParse({
        ...example,
        bedrooms: 2.5,
      }).success,
    ).toBe(false);
  });

  it("accepts only a complete metadata-valid URL baseline", () => {
    const property = exampleProperty(metadata);
    const validParams = Object.fromEntries(
      Object.entries(property).map(([key, value]) => [key, String(value)]),
    );

    expect(propertyFromSearchParams(validParams, metadata)).toEqual(property);
    expect(
      propertyFromSearchParams(
        { ...validParams, bedrooms: "2.5" },
        metadata,
      ),
    ).toBeUndefined();
    expect(
      propertyFromSearchParams(
        { ...validParams, square_footage: undefined },
        metadata,
      ),
    ).toBeUndefined();
    expect(
      propertyFromSearchParams(
        { ...validParams, bedrooms: "" },
        metadata,
      ),
    ).toBeUndefined();
  });

  it("enforces the portal comparison and what-if limits", () => {
    const property = exampleProperty(metadata);
    expect(
      createComparisonSchema(metadata).safeParse({
        properties: [property],
      }).success,
    ).toBe(false);
    expect(
      createComparisonSchema(metadata).safeParse({
        properties: Array.from({ length: 5 }, () => property),
      }).success,
    ).toBe(false);
    expect(
      createWhatIfSchema(metadata).safeParse({
        baseline: property,
        scenarios: [],
      }).success,
    ).toBe(false);
    expect(
      createWhatIfSchema(metadata).safeParse({
        baseline: property,
        scenarios: [{}],
      }).success,
    ).toBe(false);
    expect(
      createWhatIfSchema(metadata).safeParse({
        baseline: property,
        scenarios: [{ bedrooms: 2.5 }],
      }).success,
    ).toBe(false);
    expect(
      createWhatIfSchema(metadata).safeParse({
        baseline: property,
        scenarios: [{ bedrooms: 4, square_footage: 2100 }],
      }).success,
    ).toBe(true);
    expect(
      createWhatIfSchema(metadata).safeParse({
        baseline: property,
        scenarios: Array.from({ length: 7 }, () => ({
          square_footage: property.square_footage,
        })),
      }).success,
    ).toBe(true);
    expect(
      createWhatIfSchema(metadata).safeParse({
        baseline: property,
        scenarios: Array.from({ length: 8 }, () => ({
          square_footage: property.square_footage,
        })),
      }).success,
    ).toBe(false);
  });
});
