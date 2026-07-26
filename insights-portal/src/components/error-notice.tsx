import type { ErrorResponse } from "@/api/types";

export function ErrorNotice({ error, onRetry }: { error: ErrorResponse; onRetry?: () => void }) {
  return (
    <div className="error-notice" role="alert">
      <h2>Unable to complete this request</h2>
      <p>{error.message}</p>
      {onRetry ? (
        <div className="button-row" style={{ marginTop: 14 }}>
          <button className="button button-secondary" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
