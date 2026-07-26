import "server-only";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type {
  MarketAnalysis,
  MarketMetadata,
} from "@/lib/api/types";
import type { ChartDatum } from "@/lib/chart-data";
import { buildMarketReportData } from "@/lib/market-report-data";

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: "Helvetica",
    color: "#13233A",
    fontSize: 9,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#91A2B8",
    paddingBottom: 14,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#52647C",
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginTop: 6,
  },
  summary: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#C9D4E2",
    marginBottom: 18,
  },
  metric: {
    flexGrow: 1,
    padding: 10,
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
    fontSize: 12,
    fontWeight: 700,
    marginTop: 5,
  },
  chart: {
    minHeight: 210,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C9D4E2",
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  label: {
    width: "31%",
    color: "#52647C",
    fontSize: 7,
  },
  track: {
    width: "54%",
    height: 8,
    backgroundColor: "#E8EEF5",
  },
  bar: {
    height: 8,
    backgroundColor: "#1D5FD1",
  },
  value: {
    width: "15%",
    textAlign: "right",
    fontSize: 7,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 34,
    right: 34,
    borderTopWidth: 1,
    borderTopColor: "#C9D4E2",
    paddingTop: 7,
    color: "#52647C",
    fontSize: 7,
  },
});

function PdfChart({
  data,
}: {
  data: ChartDatum[];
}) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  return (
    <View style={styles.chart}>
      <Text style={styles.chartTitle}>Price distribution</Text>
      {data.length === 0 ? (
        <Text style={{ color: "#52647C" }}>
          No distribution data is available for this segment.
        </Text>
      ) : (
        data.map((item) => (
          <View style={styles.row} key={item.label}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(2, (item.value / maximum) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))
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
      <Page size="A4" style={styles.page}>
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
        <PdfChart data={report.priceDistribution} />
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
