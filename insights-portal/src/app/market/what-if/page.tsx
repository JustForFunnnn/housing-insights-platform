import { PageHeader } from "@/components/page-header";
import { WhatIfForm } from "@/features/market/what-if-form";
import { getMarketMetadata } from "@/api/server";
import { propertyFromSearchParams } from "@/lib/fields";

export const dynamic = "force-dynamic";

export default async function WhatIfPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const metadata = await getMarketMetadata();
  const initialBaseline = propertyFromSearchParams(
    await searchParams,
    metadata,
  );
  return (
    <>
      <PageHeader
        eyebrow="Market prediction instrument"
        title="Change the inputs. Measure the price shift."
        description="Set a baseline and define up to seven scenarios by changing only the features that matter. Every merged property is evaluated in one ordered prediction batch."
      />
      <WhatIfForm
        initialMetadata={metadata}
        initialBaseline={initialBaseline}
      />
    </>
  );
}
