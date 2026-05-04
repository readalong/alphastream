"use client";

import { cn } from "@/lib/utils";
import type { MarketGauge, FlowGaugeColor } from "@/lib/types";

interface MarketGaugeStripProps {
  gauge: MarketGauge;
}

const gaugeConfig: Record<FlowGaugeColor, { dot: string; text: string; label: string }> = {
  GREEN: { dot: "bg-emerald-500", text: "text-emerald-500", label: "Bullish" },
  AMBER: { dot: "bg-amber-500",   text: "text-amber-500",   label: "Neutral" },
  RED:   { dot: "bg-red-500",     text: "text-red-500",     label: "Bearish" },
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

export function MarketGaugeStrip({ gauge }: MarketGaugeStripProps) {
  const cfg = gaugeConfig[gauge.color];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
        <p className="text-xs text-[var(--text-muted)] mb-1">Market Flow</p>
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", cfg.dot)} />
          <span className={cn("text-xl font-semibold", cfg.text)}>{cfg.label}</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{gauge.color}</p>
      </div>
      <StatCard
        label="Sectors Above 60"
        value={gauge.sectors_above_60}
        sub="composite score"
      />
      <StatCard
        label="Sectors Below 40"
        value={gauge.sectors_below_40}
        sub="composite score"
      />
      <StatCard
        label="Breadth (Score 70+)"
        value={`${gauge.breadth_pct.toFixed(1)}%`}
        sub="of universe"
      />
    </div>
  );
}
