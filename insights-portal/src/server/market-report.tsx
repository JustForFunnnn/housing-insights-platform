import "server-only";

import {
  Circle,
  Document,
  Line,
  Page,
  Polyline,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type {
  MarketAnalysis,
  MarketMetadata,
} from "@/api/types";
import {
  MARKET_CHART_DEFINITIONS,
  type ChartDatum,
} from "@/lib/chart-data";
import { buildMarketReportData } from "@/lib/market-report-data";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    color: "#13233A",
    fontSize: 8,
    backgroundColor: "#F4F7FA",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#91A2B8",
    paddingBottom: 9,
    marginBottom: 11,
  },
  eyebrow: {
    color: "#52647C",
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 21,
    fontWeight: 700,
    marginTop: 4,
  },
  summary: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#C9D4E2",
    marginBottom: 11,
    backgroundColor: "#FFFFFF",
  },
  metric: {
    flexGrow: 1,
    padding: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#C9D4E2",
  },
  metricLabel: {
    color: "#52647C",
    fontSize: 7,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 3,
  },
  chartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  chart: {
    width: "49.2%",
    height: 174,
    marginBottom: 9,
    padding: 9,
    borderWidth: 1,
    borderColor: "#C9D4E2",
    backgroundColor: "#FFFFFF",
  },
  chartHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  chartCoordinate: {
    color: "#91A2B8",
    fontSize: 5.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 700,
  },
  chartDescription: {
    color: "#52647C",
    fontSize: 6,
    marginTop: 2,
    marginBottom: 5,
  },
  plotRow: {
    flexDirection: "row",
    height: 91,
  },
  yLabels: {
    width: 34,
    justifyContent: "space-between",
    paddingTop: 2,
    paddingBottom: 12,
    paddingRight: 4,
  },
  yLabel: {
    color: "#52647C",
    fontSize: 5.5,
    textAlign: "right",
  },
  plotColumn: {
    flexGrow: 1,
  },
  svg: {
    width: "100%",
    height: 72,
  },
  axisLabels: {
    flexDirection: "row",
    height: 17,
  },
  axisLabel: {
    color: "#52647C",
    fontSize: 5,
    textAlign: "center",
    paddingHorizontal: 1,
  },
  chartNote: {
    color: "#52647C",
    fontSize: 5.5,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 15,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: "#C9D4E2",
    paddingTop: 5,
    color: "#52647C",
    fontSize: 6,
  },
});

const PLOT_WIDTH = 300;
const PLOT_HEIGHT = 68;
const PLOT_TOP = 2;

function axisValue(value: number, priceValues: boolean, unit: string) {
  if (!priceValues) return String(Math.round(value));
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: unit,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)} ${unit}`;
  }
}

function PdfChart({
  coordinate,
  title,
  description,
  data,
  unit,
  priceValues,
  line,
}: {
  coordinate: string;
  title: string;
  description: string;
  data: ChartDatum[];
  unit: string;
  priceValues: boolean;
  line: boolean;
}) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  const step = PLOT_WIDTH / Math.max(data.length, 1);
  const barWidth = Math.max(8, Math.min(34, step * 0.58));
  const points = data
    .map((item, index) => {
      const x = index * step + step / 2;
      const y =
        PLOT_TOP + PLOT_HEIGHT - (item.value / maximum) * PLOT_HEIGHT;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={styles.chart}>
      <View style={styles.chartHeading}>
        <Text style={styles.eyebrow}>Visual reading</Text>
        <Text style={styles.chartCoordinate}>{coordinate}</Text>
      </View>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartDescription}>{description}</Text>
      {data.length === 0 ? (
        <Text style={{ color: "#52647C" }}>
          No chart data is available for this segment.
        </Text>
      ) : (
        <>
          <View style={styles.plotRow}>
            <View style={styles.yLabels}>
              <Text style={styles.yLabel}>
                {axisValue(maximum, priceValues, unit)}
              </Text>
              <Text style={styles.yLabel}>
                {axisValue(maximum / 2, priceValues, unit)}
              </Text>
              <Text style={styles.yLabel}>0</Text>
            </View>
            <View style={styles.plotColumn}>
              <Svg
                style={styles.svg}
                viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT + PLOT_TOP + 2}`}
              >
                {[PLOT_TOP, PLOT_TOP + PLOT_HEIGHT / 2, PLOT_TOP + PLOT_HEIGHT].map(
                  (y) => (
                    <Line
                      key={y}
                      x1={0}
                      x2={PLOT_WIDTH}
                      y1={y}
                      y2={y}
                      stroke="#C9D4E2"
                      strokeWidth={0.6}
                      strokeDasharray="3 3"
                    />
                  ),
                )}
                {line ? (
                  <>
                    <Polyline
                      points={points}
                      fill="none"
                      stroke="#1D5FD1"
                      strokeWidth={2.4}
                    />
                    {data.map((item, index) => {
                      const x = index * step + step / 2;
                      const y =
                        PLOT_TOP +
                        PLOT_HEIGHT -
                        (item.value / maximum) * PLOT_HEIGHT;
                      return (
                        <Circle
                          key={item.label}
                          cx={x}
                          cy={y}
                          r={2.8}
                          fill="#6ED3C1"
                          stroke="#13233A"
                          strokeWidth={0.8}
                        />
                      );
                    })}
                  </>
                ) : (
                  data.map((item, index) => {
                    const height = (item.value / maximum) * PLOT_HEIGHT;
                    return (
                      <Rect
                        key={item.label}
                        x={index * step + (step - barWidth) / 2}
                        y={PLOT_TOP + PLOT_HEIGHT - height}
                        width={barWidth}
                        height={Math.max(1, height)}
                        rx={1.5}
                        fill="#1D5FD1"
                      />
                    );
                  })
                )}
              </Svg>
              <View style={styles.axisLabels}>
                {data.map((item) => (
                  <Text
                    key={item.label}
                    style={[
                      styles.axisLabel,
                      { width: `${100 / data.length}%` },
                    ]}
                  >
                    {item.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.chartNote}>
            {data.length} plotted groups ·{" "}
            {priceValues
              ? "Average price"
              : "Property count"}
          </Text>
        </>
      )}
    </View>
  );
}

function MarketReport({
  analysis,
  metadata,
  filterSummary,
}: {
  analysis: MarketAnalysis;
  metadata: MarketMetadata;
  filterSummary: string;
}) {
  const report = buildMarketReportData(
    analysis,
    metadata,
    filterSummary,
  );
  return (
    <Document
      title="Housing Insights Market Report"
      author="Housing Insights"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Housing Insights / Market analysis
          </Text>
          <Text style={styles.title}>Measured market report</Text>
          <Text style={{ marginTop: 7, color: "#52647C" }}>
            Active segment: {report.segment}
          </Text>
        </View>
        <View style={styles.summary}>
          {report.metrics.map((metric) => (
            <View style={styles.metric} key={metric.label}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartGrid}>
          {MARKET_CHART_DEFINITIONS.map((chart) => (
            <PdfChart
              key={chart.key}
              coordinate={chart.coordinate}
              title={chart.title}
              description={chart.description}
              data={report.charts[chart.key]}
              unit={metadata.price_currency}
              priceValues={chart.priceValues}
              line={chart.type === "line"}
            />
          ))}
        </View>
        <Text style={styles.footer}>
          Generated {new Date().toISOString()} · Source: supplied read-only
          housing dataset
        </Text>
      </Page>
    </Document>
  );
}

export function renderMarketReport(
  analysis: MarketAnalysis,
  metadata: MarketMetadata,
  filterSummary: string,
) {
  return renderToBuffer(
    <MarketReport
      analysis={analysis}
      metadata={metadata}
      filterSummary={filterSummary}
    />,
  );
}
