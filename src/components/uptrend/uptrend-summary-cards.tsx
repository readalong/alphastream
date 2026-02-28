"use client";

import type { UptrendSummary } from "@/lib/types";

type ViewFilter = "all" | "has_resistance" | "at_ath";

interface UptrendSummaryCardsProps {
  summary: UptrendSummary;
  activeFilter: ViewFilter;
  onFilterChange: (v: ViewFilter) => void;
}

function SummaryCard({
  label,
  value,
  total,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50"
      }`}
    >
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
      <div className="mt-2">
        <div className="h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1">{pct}%</p>
      </div>
    </button>
  );
}

export function UptrendSummaryCards({
  summary,
  activeFilter,
  onFilterChange,
}: UptrendSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard
        label="Total Stage 2"
        value={summary.total_stocks}
        total={summary.total_stocks}
        color="var(--accent)"
        active={activeFilter === "all"}
        onClick={() => onFilterChange("all")}
      />
      <SummaryCard
        label="With Resistance"
        value={summary.with_resistance}
        total={summary.total_stocks}
        color="#f59e0b"
        active={activeFilter === "has_resistance"}
        onClick={() => onFilterChange("has_resistance")}
      />
      <SummaryCard
        label="At ATH (Clear)"
        value={summary.at_ath_no_resistance}
        total={summary.total_stocks}
        color="#22c55e"
        active={activeFilter === "at_ath"}
        onClick={() => onFilterChange("at_ath")}
      />
    </div>
  );
}
