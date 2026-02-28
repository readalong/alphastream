"use client";

export function AthBadge() {
  return (
    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
      <p className="text-sm font-semibold text-green-400 mb-1">
        At All-Time High
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        No overhead resistance found. Price has clear runway above.
      </p>
    </div>
  );
}
