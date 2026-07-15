"use client";

import { formatPrice } from "@/lib/utils";

interface ResistanceCellProps {
  price?: number;
  pctAbove?: number;
  isAth?: boolean;
}

export function ResistanceCell({ price, pctAbove, isAth }: ResistanceCellProps) {
  if (isAth) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[var(--long)]/15 text-[var(--long)] border border-[var(--long)]/25">
        ATH
      </span>
    );
  }

  if (price == null) {
    return <span className="text-[var(--text-muted)]">&mdash;</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono tabular-nums text-[var(--text-primary)]">
        ${formatPrice(price)}
      </span>
      {pctAbove != null && (
        <span className="text-xs text-[var(--text-muted)]">
          {pctAbove.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
