"use client";

/**
 * Shared open-ACT-count badge for nav items (docs/ux-plan-20260719.md §3.3).
 * Implemented once, consumed by sidebar.tsx and mobile-bottom-nav.tsx, fed
 * by useTriageCounts() — the same selectors that build the /today queue —
 * so a badge count can never disagree with what's actually in the queue.
 *
 * Dot for 1, number for 2+ (capped at "9+"). Amber (--caution), not red:
 * red/--short is reserved for bearish/loss semantics elsewhere in the app.
 */
export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  if (count === 1) {
    return (
      <span
        aria-label="1 item needs attention"
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--caution)]"
      />
    );
  }

  return (
    <span
      aria-label={`${count} items need attention`}
      className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-semibold leading-none bg-[var(--caution)] text-[var(--bg-sidebar)]"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
