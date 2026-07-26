import { EstimateChart } from "@/components/estimate-chart";
import type { WhatIfResponse } from "@/api/types";
import { formatPrice } from "@/lib/format";

import { DifferenceChart } from "./difference-chart";

export function WhatIfResults({
  result,
  priceCurrency,
}: {
  result: WhatIfResponse;
  priceCurrency: string;
}) {
  return (
    <section style={{ marginTop: 34 }}>
      <p className="measure-label">Scenario readings</p>
      <h2 className="instrument-title">Change from baseline</h2>
      <EstimateChart
        unit={priceCurrency}
        values={[
          {
            label: "Baseline",
            value: result.baseline_prediction,
          },
          ...result.scenarios.map((scenario, index) => ({
            label: `Scenario ${index + 1}`,
            value: scenario.predicted_price,
          })),
        ]}
      />
      <h3 className="instrument-title" style={{ marginTop: 28 }}>
        Difference from baseline
      </h3>
      <DifferenceChart
        unit={priceCurrency}
        values={result.scenarios.map((scenario, index) => ({
          label: `Scenario ${index + 1}`,
          value: scenario.price_difference,
        }))}
      />
      <div className="data-table-wrap" style={{ marginTop: 22 }}>
        <table className="data-table">
          <caption className="sr-only">
            What-if scenario results
          </caption>
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">Predicted price</th>
              <th scope="col">Absolute change</th>
              <th scope="col">Percentage change</th>
            </tr>
          </thead>
          <tbody>
            {result.scenarios.map((scenario, index) => (
              <tr key={index}>
                <th scope="row">Scenario {index + 1}</th>
                <td className="mono">
                  {formatPrice(
                    scenario.predicted_price,
                    priceCurrency,
                  )}
                </td>
                <td className="mono">
                  {scenario.price_difference >= 0 ? "+" : ""}
                  {formatPrice(
                    scenario.price_difference,
                    priceCurrency,
                  )}
                </td>
                <td className="mono">
                  {scenario.percentage_difference >= 0 ? "+" : ""}
                  {scenario.percentage_difference.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
