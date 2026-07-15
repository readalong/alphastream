"use client";

export function AthBadge() {
  return (
    <div className="rounded-lg border border-[var(--long)]/20 bg-[var(--long)]/5 p-4">
      <p className="text-sm font-semibold text-[var(--long)] mb-1">
        At all-time high
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        No overhead resistance found. Price has clear runway above.
      </p>
    </div>
  );
}
