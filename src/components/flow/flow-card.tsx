"use client";

import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { ScoreSparkline } from "./score-sparkline";
import { SubScoreBar } from "./sub-score-bar";
import type { FlowStock } from "@/lib/types";

interface FlowCardProps {
  stock: FlowStock;
  variant: "leaders" | "exits";
  compact?: boolean;
}

export function FlowCard({ stock, variant, compact = false }: FlowCardProps) {
  const isPositiveWow = stock.flow_score_wow > 0;
  const isCollapse = variant === "exits" && stock.flow_score_wow <= -15;
  const isHighRvol = stock.rvol >= 2.0;
  const isSustained = !stock.is_new_this_week && stock.weeks_on_list >= 4;
  // Divergence signals
  const isAccumulation = stock.flow_score_wow >= 8 && stock.rsi < 45;
  const isDistribution = stock.flow_score_wow <= -8 && stock.rsi > 60;

  return (
    <Link
      href={`/ticker/${stock.ticker}`}
      className={cn(
        "block rounded-lg border bg-[var(--bg-card)] p-4 space-y-3 transition-colors cursor-pointer",
        variant === "exits"
          ? "border-[var(--border)] border-l-2 border-l-red-500/40 hover:border-red-500/30"
          : "border-[var(--border)] hover:border-[var(--accent)]/30"
      )}
    >
      {/* Row 1: Rank + Ticker + Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base font-bold text-[var(--text-muted)] shrink-0 w-7">
            #{stock.rank}
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-[var(--text-primary)] transition-colors">
              {stock.ticker}
            </span>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {stock.sector} / {stock.industry}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {stock.flow_score}
            <span className="text-sm font-normal text-[var(--text-muted)]">/100</span>
          </div>
          <div
            className={cn(
              "text-xs font-medium tabular-nums",
              isPositiveWow ? "text-emerald-500" : "text-red-500"
            )}
          >
            was {stock.flow_score_prev} ({isPositiveWow ? "+" : ""}
            {stock.flow_score_wow})
          </div>
        </div>
      </div>

      {/* Row 2: Price / ADV / RVol */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
        <span className="tabular-nums">${formatPrice(stock.close_price)}</span>
        <span>ADV: ${(stock.adv_dollars / 1_000_000).toFixed(0)}M</span>
        <span className={cn(isHighRvol && "text-amber-500 font-medium")}>
          RVol: {stock.rvol.toFixed(1)}x
        </span>
      </div>

      {/* Row 3: Badges */}
      <div className="flex flex-wrap gap-1.5">
        {stock.is_new_this_week && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            NEW THIS WEEK
          </span>
        )}
        {isSustained && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            SUSTAINED {stock.weeks_on_list}w
          </span>
        )}
        {isCollapse && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-500/10 text-red-400 border border-red-500/20">
            COLLAPSE
          </span>
        )}
        {isHighRvol && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            HIGH VOL
          </span>
        )}
        {isAccumulation && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title="Flow rising while price is weak — smart money accumulating">
            ACCUMULATION
          </span>
        )}
        {isDistribution && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-500/15 text-orange-300 border border-orange-500/30" title="Flow declining while price is elevated — possible distribution">
            DISTRIBUTION
          </span>
        )}
      </div>

      {/* Row 4: Sparkline */}
      {!compact && stock.score_history.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">8w</span>
          <ScoreSparkline data={stock.score_history} variant={variant} width={120} height={22} />
        </div>
      )}

      {/* Row 5: Sub-score bars */}
      {!compact && (
        <div className="space-y-1.5">
          <SubScoreBar label="CF" value={stock.cf_score} max={stock.cf_max} color="blue" />
          <SubScoreBar label="TR" value={stock.trend_score} max={stock.trend_max} color="emerald" />
          <SubScoreBar label="MO" value={stock.mom_score} max={stock.mom_max} color="purple" />
        </div>
      )}

      {/* Compact: inline sub-scores */}
      {compact && (
        <div className="flex gap-3 text-xs text-[var(--text-muted)]">
          <span>CF {stock.cf_score}/{stock.cf_max}</span>
          <span>TR {stock.trend_score}/{stock.trend_max}</span>
          <span>MO {stock.mom_score}/{stock.mom_max}</span>
        </div>
      )}
    </Link>
  );
}
