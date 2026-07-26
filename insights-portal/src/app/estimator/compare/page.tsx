import { PageHeader } from "@/components/page-header";
import { ComparisonForm } from "@/features/estimator/comparison-form";
import { getEstimatorMetadata } from "@/api/server";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const metadata = await getEstimatorMetadata();
  return (
    <>
      <PageHeader
        eyebrow="Estimator comparison"
        title="Put competing properties on one datum."
        description="Edit two to four properties, submit one ordered batch, and inspect value and feature differences side by side."
      />
      <ComparisonForm metadata={metadata} />
    </>
  );
}
