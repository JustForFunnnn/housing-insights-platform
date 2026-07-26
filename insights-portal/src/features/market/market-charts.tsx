"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MarketAnalysis } from "@/lib/api/types";
import {
  marketChartSeries,
  type ChartDatum,
} from "@/lib/chart-data";
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
    <section
      className="parcel parcel-span-6 parcel-pad"
      data-coordinate={coordinate}
    >
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
          <Chart
            data={data}
            margin={{ top: 18, right: 16, bottom: 40, left: 8 }}
          >
            <CartesianGrid stroke="#C9D4E2" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              angle={-25}
              textAnchor="end"
              interval={0}
              tick={{ fill: "#52647C", fontSize: 11 }}
            />
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
              formatter={(value) =>
                priceValues
                  ? formatPrice(Number(value), unit)
                  : `${value} properties`
              }
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
              <Bar dataKey="value" fill="#1D5FD1" radius={[2, 2, 0, 0]} />
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
      <p className="chart-description">{data.length} plotted groups.</p>
    </section>
  );
}

export function MarketCharts({
  analysis,
  unit,
}: {
  analysis: MarketAnalysis;
  unit: string;
}) {
  const series = marketChartSeries(analysis);
  return (
    <div className="parcel-grid" style={{ marginTop: 28 }}>
      <ChartPanel
        coordinate="CHART / A-21"
        title="Price distribution"
        description="Property count across equal price bands."
        data={series.priceDistribution}
        unit={unit}
        priceValues={false}
      />
      <ChartPanel
        coordinate="CHART / B-21"
        title="Average by bedrooms"
        description="Mean price for each bedroom count in the active segment."
        data={series.bedrooms}
        unit={unit}
        priceValues
      />
      <ChartPanel
        coordinate="CHART / A-22"
        title="Average by build decade"
        description="How mean price changes across construction eras."
        data={series.decades}
        unit={unit}
        priceValues
        line
      />
      <ChartPanel
        coordinate="CHART / B-22"
        title="Average by interior area"
        description="Mean price across square-footage bands."
        data={series.squareFootage}
        unit={unit}
        priceValues
      />
    </div>
  );
}
