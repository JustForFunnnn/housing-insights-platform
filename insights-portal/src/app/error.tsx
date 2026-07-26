"use client";

import { ErrorNotice } from "@/components/error-notice";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorNotice
      error={{
        error_code: "page_error",
        message: "This view could not be loaded. Try the request again.",
      }}
      onRetry={reset}
    />
  );
}
