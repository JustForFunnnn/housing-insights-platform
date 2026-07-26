import { EstimateChart } from "@/components/estimate-chart";
import {
  FEATURE_KEYS,
  type EstimateBatch,
  type PropertyMetadata,
} from "@/api/types";
import { FIELD_DEFINITIONS } from "@/lib/fields";
import { formatNumber, formatPrice } from "@/lib/format";

export function ComparisonResults({
  result,
  metadata,
}: {
  result: EstimateBatch;
  metadata: PropertyMetadata;
}) {
  const ranked = result.estimates
    .map((record, index) => ({
      label: `Property ${String.fromCharCode(65 + index)}`,
      value: record.estimated_price,
    }))
    .sort((a, b) => a.value - b.value);
  const lowest = ranked.at(0);
  const highest = ranked.at(-1);

  return (
    <section style={{ marginTop: 34 }}>
      <p className="measure-label">Comparative reading</p>
      <h2 className="instrument-title">Values on one scale</h2>
      {lowest && highest ? (
        <div className="metric-grid" style={{ margin: "22px 0" }}>
          <div className="metric">
            <span className="measure-label">Highest · {highest.label}</span>
            <strong className="metric-value">
              {formatPrice(highest.value, metadata.price_currency)}
            </strong>
          </div>
          <div className="metric">
            <span className="measure-label">Lowest · {lowest.label}</span>
            <strong className="metric-value">
              {formatPrice(lowest.value, metadata.price_currency)}
            </strong>
          </div>
          <div className="metric">
            <span className="measure-label">Value spread</span>
            <strong className="metric-value">
              {formatPrice(
                highest.value - lowest.value,
                metadata.price_currency,
              )}
            </strong>
          </div>
        </div>
      ) : null}
      <EstimateChart
        unit={metadata.price_currency}
        values={result.estimates.map((record, index) => ({
          label: `Property ${String.fromCharCode(65 + index)}`,
          value: record.estimated_price,
        }))}
      />
      <div className="data-table-wrap" style={{ marginTop: 24 }}>
        <table className="data-table">
          <caption className="sr-only">
            Side-by-side property comparison
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              {result.estimates.map((_, index) => (
                <th scope="col" key={index}>
                  Property {String.fromCharCode(65 + index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Estimated price</th>
              {result.estimates.map((record, index) => (
                <td
                  className="mono"
                  key={`${record.created_at}-${index}`}
                >
                  {formatPrice(
                    record.estimated_price,
                    metadata.price_currency,
                  )}
                </td>
              ))}
            </tr>
            {FEATURE_KEYS.map((key) => (
              <tr key={key}>
                <th scope="row">{FIELD_DEFINITIONS[key].label}</th>
                {result.estimates.map((record, index) => (
                  <td
                    className="mono"
                    key={`${record.created_at}-${key}-${index}`}
                  >
                    {formatNumber(record.property[key])}
                    {metadata.features[key].unit
                      ? ` ${metadata.features[key].unit}`
                      : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
