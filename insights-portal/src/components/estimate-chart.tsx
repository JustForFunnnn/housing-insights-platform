"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPrice } from "@/lib/format";

export function EstimateChart({
  values,
  unit,
}: {
  values: Array<{ label: string; value: number }>;
  unit: string;
}) {
  return (
    <>
      <div
        className="chart-shell"
        role="img"
        aria-label={values
          .map((item) => `${item.label}: ${formatPrice(item.value, unit)}`)
          .join(". ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={values}
            layout={values.length > 1 ? "vertical" : "horizontal"}
            margin={{ top: 12, right: 22, bottom: 8, left: 14 }}
          >
            <CartesianGrid stroke="#C9D4E2" strokeDasharray="3 3" />
            {values.length > 1 ? (
              <>
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
              </>
            ) : (
              <>
                <XAxis dataKey="label" />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-US", {
                      notation: "compact",
                    }).format(Number(value))
                  }
                />
              </>
            )}
            <Tooltip
              formatter={(value) => formatPrice(Number(value), unit)}
              contentStyle={{
                border: "1px solid #91A2B8",
                borderRadius: 4,
              }}
            />
            <Bar
              dataKey="value"
              fill="#1D5FD1"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
