import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  offset,
  limit,
  itemCount,
  total,
  busy = false,
  onPage,
}: {
  offset: number;
  limit: number;
  itemCount: number;
  total: number;
  busy?: boolean;
  onPage: (offset: number) => void;
}) {
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(total, offset + itemCount);

  return (
    <nav className="button-row pagination" aria-label="Pagination">
      <span className="measure-label" aria-live="polite">
        {start}–{end} of {total}
      </span>
      <div className="button-row">
        <button
          className="button button-secondary"
          type="button"
          disabled={offset === 0 || busy}
          onClick={() => onPage(Math.max(0, offset - limit))}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Previous
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={offset + limit >= total || busy}
          onClick={() => onPage(offset + limit)}
        >
          Next
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
