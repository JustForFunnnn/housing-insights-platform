import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="Out of bounds"
        title="This parcel is not mapped."
        description="The requested page does not exist in this workspace."
      />
      <Link className="button" href="/">
        Return to portal
      </Link>
    </>
  );
}
