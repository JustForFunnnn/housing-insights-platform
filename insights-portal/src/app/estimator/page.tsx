import { PageHeader } from "@/components/page-header";
import { EstimatorForm } from "@/features/estimator/estimator-form";
import { getEstimatorMetadata } from "@/api/server";

export const dynamic = "force-dynamic";

export default async function EstimatorPage() {
  const metadata = await getEstimatorMetadata();
  return (
    <>
      <PageHeader
        eyebrow="Python application / estimator"
        title="Locate a property on the value scale."
        description="Enter the seven model features. The estimator validates the field sheet, calls the shared prediction model, and saves the result to history."
      />
      <EstimatorForm initialMetadata={metadata} />
    </>
  );
}
