"use client";

import { cn } from "@/lib/utils";
import type { FilterSectorContext } from "@/lib/types";

interface SectorContextStripProps {
  sectors: FilterSectorContext[];
  selectedSector?: string;
  onSelectSector?: (etf: string | "") => void;
}

export function SectorContextStrip({
  sectors,
  selectedSector,
  onSelectSector,
}: SectorContextStripProps) {
  // Sort by composite_score descending
  const sorted = [...sectors].sort((a, b) => b.composite_score - a.composite_score);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">
        Sector flow context
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((s) => {
          const isInflow = s.passed_layer1;
          const isLeader = s.tier === "LEADING";
          const isSelected = selectedSector === s.etf;
          const pctSign = s.pct_20d >= 0 ? "+" : "";

          return (
            <button
              key={s.etf}
              onClick={() => onSelectSector?.(isSelected ? "" : s.etf)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors",
                isInflow
                  ? "border-[var(--long)]/40 bg-[var(--long)]/5 hover:bg-[var(--long)]/10"
                  : "border-[var(--short)]/30 bg-[var(--short)]/5 hover:bg-[var(--short)]/10 opacity-60",
                isSelected && "ring-1 ring-[var(--accent)]"
              )}
              title={`${s.name} — ${isInflow ? "Inflow" : "Outflow"}, Score: ${s.composite_score.toFixed(0)}, ${s.stock_count_after_l2} stocks after L2`}
            >
              {/* Inflow check / outflow X */}
              <span className={cn("shrink-0 font-bold", isInflow ? "text-[var(--long)]" : "text-[var(--short)]/70")}>
                {isInflow ? "✓" : "✗"}
              </span>

              {/* ETF label — bold for LEADER */}
              <span
                className={cn(
                  isLeader ? "font-bold" : "font-medium",
                  isInflow ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}
              >
                {s.etf}
              </span>

              {/* WoW change (pct_20d) */}
              <span
                className={cn(
                  "tabular-nums",
                  s.pct_20d >= 0 ? "text-[var(--long)]" : "text-[var(--short)]"
                )}
              >
                {pctSign}{s.pct_20d.toFixed(0)}
              </span>

              {/* Composite score */}
              <span className="text-[var(--text-muted)] tabular-nums">
                {s.composite_score.toFixed(0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
