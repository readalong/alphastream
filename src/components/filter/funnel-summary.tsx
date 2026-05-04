"use client";

import { cn } from "@/lib/utils";
import type { FunnelStats } from "@/lib/types";

interface FunnelSummaryProps {
  stats: FunnelStats;
}

function Step({
  count,
  label,
  pct,
  accent,
}: {
  count: number;
  label: string;
  pct?: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-3 py-2.5 rounded-lg border min-w-[80px]",
        accent
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
          : "border-[var(--border)] bg-[var(--bg-card)]"
      )}
    >
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        )}
      >
        {count.toLocaleString()}
      </span>
      <span className="text-[10px] text-[var(--text-muted)] text-center mt-0.5 leading-tight">
        {label}
      </span>
      {pct != null && (
        <span className="text-[10px] font-medium text-emerald-500 mt-0.5">
          {pct.toFixed(0)}% pass
        </span>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <span className="text-[var(--text-muted)] text-xs self-center shrink-0">→</span>
  );
}

function LayerBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      className={cn(
        "px-2 py-1 rounded text-[10px] font-semibold border self-center whitespace-nowrap",
        color
      )}
    >
      {label}
    </div>
  );
}

export function FunnelSummary({ stats }: FunnelSummaryProps) {
  const l1Pct = stats.universe_count > 0 ? (stats.after_layer1 / stats.universe_count) * 100 : 0;
  const l2Pct = stats.after_layer1 > 0 ? (stats.after_layer2 / stats.after_layer1) * 100 : 0;
  const l4Pct = stats.after_layer3 > 0 ? (stats.after_layer4 / stats.after_layer3) * 100 : 0;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
        Funnel
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Step count={stats.universe_count} label="Universe" />
        <Arrow />
        <LayerBadge label="FLOW" color="border-blue-500/40 bg-blue-500/10 text-blue-400" />
        <Arrow />
        <Step count={stats.after_layer1} label="After L1" pct={l1Pct} />
        <Arrow />
        <LayerBadge label="TREND" color="border-emerald-500/40 bg-emerald-500/10 text-emerald-400" />
        <Arrow />
        <Step count={stats.after_layer2} label="After L2" pct={l2Pct} />
        <Arrow />
        <LayerBadge label="RS" color="border-purple-500/40 bg-purple-500/10 text-purple-400" />
        <Arrow />
        <Step count={stats.after_layer3} label="After L3" />
        <Arrow />
        <LayerBadge label="MOM" color="border-amber-500/40 bg-amber-500/10 text-amber-400" />
        <Arrow />
        <Step count={stats.after_layer4} label="After L4" pct={l4Pct} />
        <Arrow />
        <Step count={stats.returned} label="Shown" accent />
      </div>
    </div>
  );
}
