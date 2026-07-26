import { PageHeader } from "@/components/page-header";
import { HistoryView } from "@/features/estimator/history-view";
import {
  getEstimates,
  getEstimatorMetadata,
} from "@/api/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [metadata, page] = await Promise.all([
    getEstimatorMetadata(),
    getEstimates("limit=20&offset=0"),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Estimator archive"
        title="Previous model readings."
        description="The estimator database keeps each successful result. Records are shown newest first and stay isolated from the market application."
      />
      <HistoryView metadata={metadata} initialPage={page} />
    </>
  );
}
