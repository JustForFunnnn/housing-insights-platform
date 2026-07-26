import { ArrowUpRight, BarChart3, Calculator } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export default function PortalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Unified property workspace"
        title="Measure one home. Read the whole market."
        description="Two independent applications share one field language: estimate a property with the Python service, then examine the market through the Java analysis service."
      />

      <section className="parcel-grid" aria-label="Housing applications">
        <article
          className="parcel parcel-span-6 parcel-pad"
          data-coordinate="EST / A-01"
        >
          <Calculator
            size={31}
            color="var(--survey-blue)"
            aria-hidden="true"
          />
          <p className="measure-label" style={{ marginTop: 26 }}>
            Property instrument
          </p>
          <h2 className="instrument-title">Property Value Estimator</h2>
          <p className="instrument-copy">
            Enter one property, review previous estimates, or compare up to
            four scenarios on the same scale.
          </p>
          <Link
            className="button"
            href="/estimator"
            style={{ marginTop: 26 }}
          >
            Open estimator <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article
          className="parcel parcel-span-6 parcel-pad"
          data-coordinate="MKT / B-01"
        >
          <BarChart3
            size={31}
            color="var(--measurement-amber)"
            aria-hidden="true"
          />
          <p className="measure-label" style={{ marginTop: 26 }}>
            Market instrument
          </p>
          <h2 className="instrument-title">Property Market Analysis</h2>
          <p className="instrument-copy">
            Filter the supplied dataset, inspect price structure, export the
            current segment, and test future scenarios.
          </p>
          <Link
            className="button"
            href="/market"
            style={{ marginTop: 26 }}
          >
            Open market <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <div
          className="parcel parcel-span-12 parcel-pad"
          data-coordinate="DATUM / SHARED"
        >
          <p className="measure-label">How to read this workspace</p>
          <p className="instrument-copy" style={{ maxWidth: 820 }}>
            Estimator history is private to its application. Market analysis
            always uses the supplied read-only dataset. Both applications call
            the same prediction model through their own backend boundary.
          </p>
        </div>
      </section>
    </>
  );
}
