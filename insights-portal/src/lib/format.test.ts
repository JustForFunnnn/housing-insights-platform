import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format";

describe("price formatting", () => {
  it("uses the metadata price currency", () => {
    expect(formatPrice(125000, "USD")).toContain("$125,000");
    expect(formatPrice(125000, "EUR")).toMatch(/€125,000|125,000\s?€/);
  });

  it("keeps non-ISO units visible without converting values", () => {
    expect(formatPrice(125000, "credits")).toBe("125,000 credits");
    expect(formatPrice(null, "USD")).toBe("Not available");
  });
});
