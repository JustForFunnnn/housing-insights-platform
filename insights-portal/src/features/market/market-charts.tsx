"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MarketAnalysisResponse } from "@/api/types";
import { MARKET_CHART_DEFINITIONS, marketChartSeries, type ChartDatum } from "@/lib/chart-data";
import { formatPrice } from "@/lib/format";

function ChartPanel({
  coordinate,
  title,
  description,
  data,
  unit,
  priceValues,
  line = false,
}: {
  coordinate: string;
  title: string;
  description: string;
  data: ChartDatum[];
  unit: string;
  priceValues: boolean;
  line?: boolean;
}) {
  const Chart = line ? LineChart : BarChart;
  return (
    <section className="parcel parcel-span-6 parcel-pad" data-coordinate={coordinate}>
      <p className="measure-label">Visual reading</p>
      <h2 className="instrument-title">{title}</h2>
      <p className="instrument-copy">{description}</p>
      <div
        className="chart-shell"
        role="img"
        aria-label={data
          .map((item) =>
            priceValues
              ? `${item.label}: ${formatPrice(item.value, unit)}, ${item.count} properties`
              : `${item.label}: ${item.value} properties`,
          )
          .join(". ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 18, right: 16, bottom: 40, left: 8 }}>
            <CartesianGrid stroke="#C9D4E2" strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-25} textAnchor="end" interval={0} tick={{ fill: "#52647C", fontSize: 11 }} />
            <YAxis
              tickFormatter={(value) =>
                priceValues
                  ? new Intl.NumberFormat("en-US", {
                      notation: "compact",
                    }).format(Number(value))
                  : String(value)
              }
              tick={{ fill: "#52647C", fontSize: 11 }}
            />
            <Tooltip
              shared={false}
              formatter={(value) => (priceValues ? formatPrice(Number(value), unit) : `${value} properties`)}
              contentStyle={{
                border: "1px solid #91A2B8",
                borderRadius: 4,
              }}
            />
            {line ? (
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1D5FD1"
                strokeWidth={3}
                dot={{ r: 4, fill: "#6ED3C1", stroke: "#13233A" }}
              />
            ) : (
              <Bar
                dataKey="value"
                fill="#1D5FD1"
                radius={[2, 2, 0, 0]}
                activeBar={{ stroke: "#13233A", strokeWidth: 3 }}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
      <p className="chart-description">{data.length} plotted groups.</p>
    </section>
  );
}

export function MarketCharts({ analysis, unit }: { analysis: MarketAnalysisResponse; unit: string }) {
  const series = marketChartSeries(analysis);
  return (
    <div className="parcel-grid" style={{ marginTop: 28 }}>
      {MARKET_CHART_DEFINITIONS.map((chart) => (
        <ChartPanel
          key={chart.key}
          coordinate={chart.coordinate}
          title={chart.title}
          description={chart.description}
          data={series[chart.key]}
          unit={unit}
          priceValues={chart.priceValues}
          line={chart.type === "line"}
        />
      ))}
    </div>
  );
}
