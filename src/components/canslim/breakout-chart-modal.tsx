"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatternBadge } from "./pattern-badge";
import { GradeBadge } from "./grade-badge";
import { useBreakoutChart } from "@/hooks/use-canslim";
import type { BreakoutEntry } from "@/lib/types";

interface BreakoutChartModalProps {
  ticker: string | null;
  entry: BreakoutEntry | null;
  onClose: () => void;
}

export function BreakoutChartModal({ ticker, entry, onClose }: BreakoutChartModalProps) {
  const [timeframe, setTimeframe] = useState<"weekly" | "daily">("weekly");

  // Esc to close
  useEffect(() => {
    if (!ticker) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [ticker, onClose]);

  // Reset timeframe when opening a new ticker
  useEffect(() => {
    if (ticker) setTimeframe("weekly");
  }, [ticker]);

  const { data: chartData, isLoading, error, refetch } =
    useBreakoutChart(ticker ?? "", timeframe, 65, !!ticker);

  if (!ticker || !entry) return null;

  const hasPattern = entry.pattern !== "NONE" && entry.pattern !== "INSUFFICIENT_DATA";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="font-mono text-lg font-bold text-[var(--text-primary)]">{ticker}</h2>
              <GradeBadge score={entry.canslim_score} grade={entry.canslim_grade} />
              {hasPattern && (
                <PatternBadge pattern={entry.pattern} stage={entry.stage} />
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={`/ticker/${ticker}?tab=canslim`}
                onClick={onClose}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors"
                title="Full CAN SLIM analysis"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 overflow-y-auto">
            {/* Timeframe toggle */}
            <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-2">
              <div className="flex gap-1 p-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">
                {(["weekly", "daily"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={cn(
                      "px-2.5 py-0.5 rounded text-xs font-medium transition-colors capitalize",
                      timeframe === tf
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart image */}
            <div className="px-4">
              {isLoading ? (
                <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] animate-pulse" />
              ) : error ? (
                <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex flex-col items-center justify-center gap-2">
                  <p className="text-sm text-[var(--text-muted)]">Chart unavailable</p>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                </div>
              ) : chartData?.chart_b64 ? (
                <img
                  src={`data:image/png;base64,${chartData.chart_b64}`}
                  alt={`${ticker} O'Neil ${timeframe} chart`}
                  className="w-full rounded-lg border border-[var(--border)]"
                />
              ) : (
                <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center">
                  <p className="text-xs text-[var(--text-muted)]">No chart data</p>
                </div>
              )}
            </div>

            {/* Stats bar */}
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {entry.pivot != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Pivot</p>
                  <p className="font-mono font-semibold text-emerald-400">${entry.pivot.toFixed(2)}</p>
                </div>
              )}
              {entry.stop_loss != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Stop</p>
                  <p className="font-mono font-semibold text-red-400">
                    ${entry.stop_loss.toFixed(2)}
                    {entry.stop_loss_pct != null && (
                      <span className="text-[var(--text-muted)] font-normal ml-1">({entry.stop_loss_pct.toFixed(0)}%)</span>
                    )}
                  </p>
                </div>
              )}
              {entry.pct_above_pivot != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">% Above Pivot</p>
                  <p className={cn(
                    "font-mono font-semibold",
                    entry.pct_above_pivot > 5 ? "text-orange-400" : entry.pct_above_pivot > 2 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {entry.pct_above_pivot > 0 ? "+" : ""}{entry.pct_above_pivot.toFixed(1)}%
                  </p>
                </div>
              )}
              {entry.volume_ratio != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Volume</p>
                  <p className="font-mono text-[var(--text-primary)]">{entry.volume_ratio.toFixed(2)}×</p>
                </div>
              )}
              {entry.eps_growth_yoy != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">EPS YoY</p>
                  <p className={cn("font-mono font-semibold", entry.eps_growth_yoy >= 25 ? "text-emerald-400" : "text-[var(--text-muted)]")}>
                    {entry.eps_growth_yoy >= 0 ? "+" : ""}{entry.eps_growth_yoy.toFixed(0)}%
                  </p>
                </div>
              )}
              {entry.rs_percentile != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">RS Rank</p>
                  <p className="font-mono text-[var(--text-primary)]">
                    {entry.rs_percentile}th{entry.rs_52w_high ? " ★" : ""}
                  </p>
                </div>
              )}
              {entry.weeks_in_base != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Base</p>
                  <p className="font-mono text-[var(--text-primary)]">{entry.weeks_in_base} wks</p>
                </div>
              )}
              {entry.days_since_breakout != null && (
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Days Since BO</p>
                  <p className="font-mono text-[var(--text-primary)]">{entry.days_since_breakout}d</p>
                </div>
              )}
            </div>

            {/* Extended warning */}
            {entry.extended && (
              <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-500/30 bg-orange-500/5">
                <p className="text-xs text-orange-300">
                  ⚠ Extended — O'Neil rule: if you missed the breakout, wait for the next base to form.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between shrink-0">
            <p className="text-[10px] text-[var(--text-muted)]">
              Buy at pivot · Stop −8% · No buys in RED regime
            </p>
            <Link
              href={`/ticker/${ticker}?tab=canslim`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors text-xs font-medium"
            >
              Full Analysis
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
