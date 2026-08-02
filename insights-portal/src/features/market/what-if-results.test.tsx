import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhatIfResults } from "@/features/market/what-if-results";

describe("WhatIfResults", () => {
  it("shows the baseline before the scenario rows", () => {
    render(
      <WhatIfResults
        priceCurrency="USD"
        result={{
          baseline_prediction: 300000,
          scenarios: [
            {
              predicted_price: 315000,
              price_difference: 15000,
              percentage_difference: 5,
            },
          ],
        }}
      />,
    );

    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByRole("rowheader")).toHaveTextContent("Baseline");
    expect(within(rows[1]).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["$300,000", "-", "-"]);
    expect(within(rows[2]).getByRole("rowheader")).toHaveTextContent("Scenario 1");
  });
});
