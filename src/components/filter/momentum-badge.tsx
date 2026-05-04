"use client";

import { cn } from "@/lib/utils";

type RSIRegime = "STRONG" | "BULLISH" | "UNKNOWN";

interface MomentumBadgeProps {
  regime: RSIRegime;
  score: number;
  maxScore?: number;
}

const regimeConfig: Record<RSIRegime, { label: string; cls: string }> = {
  STRONG:  { label: "STRONG",  cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  BULLISH: { label: "BULLISH", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  UNKNOWN: { label: "—",       cls: "bg-[var(--border)] text-[var(--text-muted)] border-[var(--border)]" },
};

export function MomentumBadge({ regime, score, maxScore = 40 }: MomentumBadgeProps) {
  const cfg = regimeConfig[regime];

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "px-1.5 py-0.5 text-[10px] font-semibold rounded border whitespace-nowrap",
          cfg.cls
        )}
      >
        {cfg.label}
      </span>
      <span className="text-xs tabular-nums text-[var(--text-muted)]">
        {score}
        <span className="text-[10px]">/{maxScore}</span>
      </span>
    </div>
  );
}
