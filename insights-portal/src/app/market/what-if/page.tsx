import { PageHeader } from "@/components/page-header";
import { WhatIfForm } from "@/features/market/what-if-form";
import { getMarketMetadata } from "@/api/server";

export const dynamic = "force-dynamic";

export default async function WhatIfPage() {
  const metadata = await getMarketMetadata();
  return (
    <>
      <PageHeader
        eyebrow="Market prediction instrument"
        title="Move one variable. Read the value shift."
        description="Set a baseline and up to four alternative properties. The market service sends one ordered batch to the shared prediction model and reports every change."
      />
      <WhatIfForm initialMetadata={metadata} />
    </>
  );
}
