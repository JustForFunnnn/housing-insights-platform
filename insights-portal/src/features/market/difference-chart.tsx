"use client";

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
} from "recharts";

import { formatPrice } from "@/lib/format";

interface DifferenceChartProps {
  values: Array<{ label: string; value: number }>;
  unit: string;
}

export function DifferenceChart({
  values,
  unit,
}: DifferenceChartProps) {
  return (
    <>
      <div
        className="chart-shell"
        role="img"
        aria-label={values
          .map(
            (item) =>
              `${item.label}: ${item.value >= 0 ? "increase" : "decrease"} of ${formatPrice(Math.abs(item.value), unit)}`,
          )
          .join(". ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={values}
            layout="vertical"
            margin={{ top: 12, right: 22, bottom: 8, left: 14 }}
          >
            <CartesianGrid stroke="#C9D4E2" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                }).format(Number(value))
              }
            />
            <YAxis
              type="category"
              dataKey="label"
              width={88}
              tick={{ fill: "#52647C", fontSize: 12 }}
            />
            <ReferenceLine x={0} stroke="#13233A" />
            <Tooltip
              formatter={(value) => formatPrice(Number(value), unit)}
              contentStyle={{
                border: "1px solid #91A2B8",
                borderRadius: 4,
              }}
            />
            <Bar dataKey="value" radius={[2, 2, 2, 2]}>
              {values.map((item) => (
                <Cell
                  key={item.label}
                  fill={item.value >= 0 ? "#1D5FD1" : "#B4233A"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-description">
        Blue extends above the baseline; red extends below it. Exact values
        follow in the table.
      </p>
    </>
  );
}
