import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PropertyFields } from "@/components/property-fields";
import type {
  FeatureKey,
  PropertyMetadata,
} from "@/lib/api/types";

const metadata: PropertyMetadata = {
  fields: {
    square_footage: { min: 400, max: 5000, unit: "sq_ft" },
    bedrooms: { min: 0, max: 10, unit: null },
    bathrooms: { min: 0, max: 10, unit: null },
    year_built: { min: 1900, max: 2026, unit: "year" },
    lot_size: { min: 500, max: 20000, unit: "sq_ft" },
    distance_to_city_center: { min: 0, max: 50, unit: "mi" },
    school_rating: { min: 0, max: 10, unit: null },
  },
  price: { unit: "USD" },
};

function registerField(key: FeatureKey) {
  return {
    name: key,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  };
}

describe("metadata property fields", () => {
  it("renders metadata min, max and units with OpenAPI-derived steps", () => {
    render(
      <PropertyFields
        metadata={metadata}
        registerField={registerField}
      />,
    );

    expect(screen.getByLabelText("Interior area (sq ft)")).toHaveAttribute(
      "min",
      "400",
    );
    expect(screen.getByLabelText("Interior area (sq ft)")).toHaveAttribute(
      "max",
      "5000",
    );
    expect(screen.getByLabelText("Bedrooms")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("Bathrooms")).toHaveAttribute(
      "step",
      "any",
    );
    expect(
      screen.getByLabelText("Distance to city center (mi)"),
    ).toBeVisible();
  });

  it("associates validation messages with their inputs", () => {
    render(
      <PropertyFields
        metadata={metadata}
        registerField={registerField}
        errors={{ bedrooms: "Bedrooms must be a whole number." }}
      />,
    );

    const input = screen.getByLabelText("Bedrooms");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Bedrooms must be a whole number.",
    );
  });
});
