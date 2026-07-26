import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import type { WhatIfResponse } from "@/api/types";
import { formatPrice } from "@/lib/format";

interface ScenarioPricePoint {
  label: string;
  isBaseline: boolean;
  predictedPrice: number;
  priceDifference: number;
  percentageDifference: number;
}

function signedPrice(value: number, unit: string) {
  return `${value >= 0 ? "+" : ""}${formatPrice(value, unit)}`;
}

function signedPercentage(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function ScenarioPriceTooltip({
  active,
  payload,
  unit,
}: TooltipContentProps & { unit: string }) {
  if (!active || payload.length === 0) return null;
  const point = payload[0]?.payload as ScenarioPricePoint | undefined;
  if (!point) return null;

  return (
    <div className="chart-tooltip">
      <strong>{point.label}</strong>
      <dl>
        <div>
          <dt>Price</dt>
          <dd>{formatPrice(point.predictedPrice, unit)}</dd>
        </div>
        <div>
          <dt>Change</dt>
          <dd>{signedPrice(point.priceDifference, unit)}</dd>
        </div>
        <div>
          <dt>Percentage</dt>
          <dd>{signedPercentage(point.percentageDifference)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function WhatIfResults({
  result,
  priceCurrency,
}: {
  result: WhatIfResponse;
  priceCurrency: string;
}) {
  const chartData: ScenarioPricePoint[] = [
    {
      label: "Baseline",
      isBaseline: true,
      predictedPrice: result.baseline_prediction,
      priceDifference: 0,
      percentageDifference: 0,
    },
    ...result.scenarios.map((scenario, index) => ({
      label: `Scenario ${index + 1}`,
      isBaseline: false,
      predictedPrice: scenario.predicted_price,
      priceDifference: scenario.price_difference,
      percentageDifference: scenario.percentage_difference,
    })),
  ];
  const baselineLabel = `Baseline ${formatPrice(
    result.baseline_prediction,
    priceCurrency,
  )}`;

  return (
    <section style={{ marginTop: 34 }}>
      <p className="measure-label">Scenario readings</p>
      <h2 className="instrument-title">Scenario prices</h2>
      <div
        className="chart-shell what-if-price-chart"
        role="img"
        aria-label={chartData
          .map(
            (point) =>
              `${point.label}: ${formatPrice(
                point.predictedPrice,
                priceCurrency,
              )}; change ${signedPrice(
                point.priceDifference,
                priceCurrency,
              )}; ${signedPercentage(
                point.percentageDifference,
              )}`,
          )
          .join(". ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 24, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#C9D4E2"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#52647C", fontSize: 12 }}
            />
            <YAxis
              width={72}
              domain={[0, "auto"]}
              tick={{ fill: "#52647C", fontSize: 11 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                }).format(Number(value))
              }
            />
            <Tooltip
              shared={false}
              cursor={{ fill: "rgba(29, 95, 209, 0.06)" }}
              position={{ x: 84, y: 18 }}
              content={(props) => (
                <ScenarioPriceTooltip
                  {...props}
                  unit={priceCurrency}
                />
              )}
            />
            <ReferenceLine
              y={result.baseline_prediction}
              ifOverflow="extendDomain"
              stroke="#13233A"
              strokeDasharray="7 4"
              strokeWidth={1.5}
              label={{
                value: baselineLabel,
                position: "insideTopRight",
                fill: "#13233A",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="predictedPrice"
              name="Predicted price"
              maxBarSize={72}
              radius={[3, 3, 0, 0]}
              activeBar={{ stroke: "#13233A", strokeWidth: 3 }}
            >
              {chartData.map((point) => (
                <Cell
                  key={point.label}
                  fill={
                    point.isBaseline
                      ? "#13233A"
                      : point.priceDifference >= 0
                      ? "#1D5FD1"
                      : "#B4233A"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
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
                  {signedPrice(
                    scenario.price_difference,
                    priceCurrency,
                  )}
                </td>
                <td className="mono">
                  {signedPercentage(
                    scenario.percentage_difference,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
