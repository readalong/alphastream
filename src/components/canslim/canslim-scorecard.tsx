"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CriteriaCell } from "./criteria-cell";
import { GradeBadge } from "./grade-badge";
import { PatternBadge } from "./pattern-badge";
import { useBreakoutChart } from "@/hooks/use-canslim";
import type { CANSLIMResult } from "@/lib/types";

// Human-readable pattern names for the pattern panel
const PATTERN_NAMES: Partial<Record<string, string>> = {
  CUP_AND_HANDLE:  "Cup & Handle",
  FLAT_BASE:       "Flat Base",
  DOUBLE_BOTTOM:   "Double Bottom",
  SAUCER:          "Saucer",
  HIGH_TIGHT_FLAG: "High Tight Flag",
};

const DATA_QUALITY_BADGE: Record<string, { label: string; cls: string }> = {
  FULL:       { label: "Full Data",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  PARTIAL:    { label: "Partial Data", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  PROXY_ONLY: { label: "Proxy Data",   cls: "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border)]" },
};

interface CanslimScorecardProps {
  result: CANSLIMResult;
  showChart?: boolean;
}

export function CanslimScorecardCard({ result, showChart = false }: CanslimScorecardProps) {
  const [chartTimeframe, setChartTimeframe] = useState<"weekly" | "daily">("weekly");
  const { data: chartData, isLoading: chartLoading, error: chartError, refetch } =
    useBreakoutChart(result.ticker, chartTimeframe, 65, showChart);

  const { pattern, criteria, canslim_score, canslim_grade, data_quality, as_of_date } = result;
  const hasPattern = !!pattern && pattern.pattern_detected !== "NONE" && pattern.pattern_detected !== "INSUFFICIENT_DATA";
  const dqBadge = DATA_QUALITY_BADGE[data_quality] ?? DATA_QUALITY_BADGE.PROXY_ONLY;

  // Criterion order: M first (go/no-go gate), then L, I, N, then fundamentals C, A, S
  const criterionOrder = ["M", "L", "I", "N", "C", "A", "S"] as const;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <GradeBadge score={canslim_score} grade={canslim_grade} size="lg" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">CAN SLIM Score</p>
            <p className="text-xs text-[var(--text-muted)]">
              {canslim_score} of 7 criteria pass · {as_of_date}
            </p>
          </div>
        </div>
        <span
          className={cn("px-2 py-0.5 rounded border text-[10px] font-medium", dqBadge.cls)}
          title={data_quality === "PROXY_ONLY" ? "C and A criteria may pass by default — yfinance data unavailable for this ticker" : undefined}
        >
          {dqBadge.label}
        </span>
      </div>

      {/* Extended warning */}
      {pattern?.extended && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/5 border-b border-orange-500/20">
          <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
          <p className="text-xs text-orange-300">
            Extended breakout — price is {pattern.time_since_breakout_days != null ? `${pattern.time_since_breakout_days} days` : ">5 weeks"} past pivot. O'Neil rule: wait for the next base to form.
          </p>
        </div>
      )}

      {/* Proxy data warning */}
      {data_quality === "PROXY_ONLY" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border-b border-[var(--border)]">
          <Info className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
          <p className="text-[11px] text-[var(--text-muted)]">
            C and A criteria scored from proxies only — yfinance returned no fundamental data. Treat with caution.
          </p>
        </div>
      )}

      {/* 7-criterion grid */}
      <div className="p-4">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {criterionOrder.map(key => (
            <CriteriaCell
              key={key}
              letter={key}
              criterion={criteria[key]}
              dataQuality={data_quality}
            />
          ))}
        </div>
      </div>

      {/* Pattern panel */}
      <div className="px-4 pb-4">
        <div className={cn(
          "rounded-lg border p-3 space-y-2",
          hasPattern ? "border-[var(--border)] bg-[var(--bg-primary)]" : "border-[var(--border)] bg-[var(--bg-primary)]"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                O'Neil Pattern
              </p>
              {hasPattern && (
                <PatternBadge pattern={pattern.pattern_detected} stage={pattern.stage} size="md" />
              )}
            </div>
            {hasPattern && (
              <span className="text-xs text-[var(--text-muted)]">
                Confidence {Math.round(pattern.confidence * 100)}%
              </span>
            )}
          </div>

          {!hasPattern ? (
            <p className="text-xs text-[var(--text-muted)]">
              {pattern?.pattern_detected === "INSUFFICIENT_DATA"
                ? "Insufficient price history (<65 weeks) for pattern detection."
                : "No O'Neil base pattern detected at this time."}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {pattern.pivot_price != null && (
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Pivot</p>
                    <p className="font-mono font-semibold text-emerald-400">${pattern.pivot_price.toFixed(2)}</p>
                  </div>
                )}
                {pattern.stop_loss_price != null && (
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Stop</p>
                    <p className="font-mono font-semibold text-red-400">
                      ${pattern.stop_loss_price.toFixed(2)}
                      {pattern.stop_loss_pct != null && (
                        <span className="text-[var(--text-muted)] font-normal ml-1">({pattern.stop_loss_pct.toFixed(0)}%)</span>
                      )}
                    </p>
                  </div>
                )}
                {pattern.weeks_in_base != null && (
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Base</p>
                    <p className="font-mono text-[var(--text-primary)]">{pattern.weeks_in_base} wks</p>
                  </div>
                )}
                {pattern.depth_pct != null && (
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Depth</p>
                    <p className="font-mono text-[var(--text-primary)]">{pattern.depth_pct.toFixed(1)}%</p>
                  </div>
                )}
              </div>

              {/* Volume character */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-[var(--border)]">
                {pattern.up_down_volume_ratio != null && (
                  <span className={cn(
                    "flex items-center gap-1 text-[11px]",
                    pattern.up_down_volume_ratio >= 1 ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {pattern.up_down_volume_ratio >= 1
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    Up/Dn vol {pattern.up_down_volume_ratio.toFixed(2)}×
                    {pattern.up_down_volume_ratio >= 1 ? " (accumulation)" : " (distribution)"}
                  </span>
                )}
                {pattern.base_volume_dry && (
                  <span className="text-[11px] text-emerald-400">Base vol dry ✓</span>
                )}
                {pattern.right_side_above_midpoint != null && (
                  <span className={cn("text-[11px]", pattern.right_side_above_midpoint ? "text-emerald-400" : "text-amber-400")}>
                    Handle {pattern.right_side_above_midpoint ? "above" : "below"} midpoint
                  </span>
                )}
                {pattern.volume_ratio_at_breakout != null && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    BO vol {pattern.volume_ratio_at_breakout.toFixed(2)}×
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Annotated chart */}
      {showChart && (
        <div className="px-4 pb-4 space-y-2">
          {/* Timeframe toggle */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Annotated Chart
            </p>
            <div className="flex gap-1 p-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">
              {(["weekly", "daily"] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize",
                    chartTimeframe === tf
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Chart display */}
          {chartLoading ? (
            <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] animate-pulse" />
          ) : chartError ? (
            <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-[var(--text-muted)]">Chart unavailable</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : chartData?.chart_b64 ? (
            <img
              src={`data:image/png;base64,${chartData.chart_b64}`}
              alt={`${result.ticker} O'Neil ${chartTimeframe} breakout chart`}
              className="w-full rounded-lg border border-[var(--border)]"
            />
          ) : null}

          {/* O'Neil rules reminder */}
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Buy at pivot · Stop at −8% · Never buy extended · No new buys in RED regime
          </p>
        </div>
      )}
    </div>
  );
}
