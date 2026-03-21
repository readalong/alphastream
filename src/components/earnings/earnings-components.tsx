"use client";

import { useState } from "react";
import { ChevronDown, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EarningsResponse, EarningsSignal } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRevenue(val: number | null): string {
  if (val == null) return "—";
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
}

function formatPct(val: number | null, decimals = 1): string {
  if (val == null) return "—";
  return val >= 0 ? `+${val.toFixed(decimals)}%` : `${val.toFixed(decimals)}%`;
}

const SIGNAL_STYLE: Record<EarningsSignal, string> = {
  EPS_BEAT:              "bg-green-500/15 text-green-400 border-green-500/30",
  EPS_MISS:              "bg-red-500/15 text-red-400 border-red-500/30",
  EPS_IN_LINE:           "bg-slate-500/15 text-slate-400 border-slate-500/30",
  STRONG_EPS_GROWTH:     "bg-green-500/15 text-green-400 border-green-500/30",
  EPS_DECLINE:           "bg-red-500/15 text-red-400 border-red-500/30",
  STRONG_REVENUE_GROWTH: "bg-green-500/15 text-green-400 border-green-500/30",
  REVENUE_DECLINE:       "bg-red-500/15 text-red-400 border-red-500/30",
  ACCELERATING_GROWTH:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  DECELERATING_GROWTH:   "bg-red-600/15 text-red-300 border-red-600/30",
  MARGIN_EXPANSION:      "bg-teal-500/15 text-teal-400 border-teal-500/30",
  MARGIN_CONTRACTION:    "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

function SignalBadge({ signal }: { signal: EarningsSignal }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap",
        SIGNAL_STYLE[signal]
      )}
    >
      {signal.replace(/_/g, " ")}
    </span>
  );
}

// ─── Compact sidebar highlight ───────────────────────────────────────────────

export function EarningsHighlight({
  data,
  onViewEarnings,
}: {
  data: EarningsResponse;
  onViewEarnings: () => void;
}) {
  const q = data.quarters[0];
  if (!q) return null;

  const isBeat = q.signals.includes("EPS_BEAT");
  const isMiss = q.signals.includes("EPS_MISS");
  const epsColor = isBeat ? "text-green-400" : isMiss ? "text-red-400" : "text-[var(--text-primary)]";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Earnings
        </h3>
        <span className="text-xs font-medium text-[var(--text-muted)]">{q.fiscal_quarter}</span>
      </div>

      {/* EPS */}
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-[var(--text-muted)]">EPS</span>
        <div className="flex items-center gap-1.5">
          {q.eps.actual != null ? (
            <span className={cn("font-mono text-sm font-semibold", epsColor)}>
              ${q.eps.actual.toFixed(2)}
            </span>
          ) : (
            <span className="text-sm text-[var(--text-muted)]">—</span>
          )}
          {q.eps.estimate != null && (
            <span className="text-[10px] text-[var(--text-muted)]">
              est ${q.eps.estimate.toFixed(2)}
            </span>
          )}
          {q.eps.surprise_pct != null && (
            <span
              className={cn(
                "text-[10px] font-medium",
                q.eps.surprise_pct > 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {formatPct(q.eps.surprise_pct)}
            </span>
          )}
        </div>
      </div>

      {/* Revenue */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-[var(--text-muted)]">Revenue</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm text-[var(--text-primary)]">
            {formatRevenue(q.revenue.actual)}
          </span>
          {q.revenue.yoy_growth_pct != null && (
            <span
              className={cn(
                "text-[10px] font-medium",
                q.revenue.yoy_growth_pct >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {formatPct(q.revenue.yoy_growth_pct)} YoY
            </span>
          )}
        </div>
      </div>

      {/* Top signals */}
      {q.signals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {q.signals.slice(0, 3).map((s) => (
            <SignalBadge key={s} signal={s} />
          ))}
          {q.signals.length > 3 && (
            <span className="text-[10px] text-[var(--text-muted)] self-center">
              +{q.signals.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Next earnings */}
      {data.next_earnings && (
        <div className="pt-2.5 border-t border-[var(--border)] space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            <Calendar className="h-3 w-3" />
            Next Earnings
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[var(--text-primary)]">
              {data.next_earnings.date_range[0]}
              {data.next_earnings.date_range[1] &&
                data.next_earnings.date_range[1] !== data.next_earnings.date_range[0] &&
                ` – ${data.next_earnings.date_range[1].slice(5)}`}
            </span>
            {data.next_earnings.eps_estimate != null && (
              <span className="text-xs text-[var(--text-muted)]">
                Est EPS{" "}
                <span className="font-mono text-[var(--text-primary)]">
                  ${data.next_earnings.eps_estimate.toFixed(2)}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onViewEarnings}
        className="mt-3 w-full text-xs text-[var(--accent)] hover:underline text-right"
      >
        Full breakdown →
      </button>
    </div>
  );
}

// ─── Full earnings tab ───────────────────────────────────────────────────────

export function EarningsTab({ data }: { data: EarningsResponse }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Next Earnings Banner */}
      {data.next_earnings && (
        <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Next Earnings</span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                Date Window
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {data.next_earnings.date_range[0]}
                {data.next_earnings.date_range[1] &&
                  data.next_earnings.date_range[1] !== data.next_earnings.date_range[0] &&
                  ` – ${data.next_earnings.date_range[1]}`}
              </span>
            </div>
            {data.next_earnings.eps_estimate != null && (
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                  Est EPS
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  ${data.next_earnings.eps_estimate.toFixed(2)}
                </span>
              </div>
            )}
            {data.next_earnings.revenue_estimate != null && (
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                  Est Revenue
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {formatRevenue(data.next_earnings.revenue_estimate)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quarterly results */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Quarterly Results · Last {data.quarters_returned} Quarters
          </h3>
        </div>

        <div className="space-y-2">
          {data.quarters.map((q) => {
            const isExpanded = expandedId === q.fiscal_quarter;
            const isBeat = q.signals.includes("EPS_BEAT");
            const isMiss = q.signals.includes("EPS_MISS");
            const epsColor = isBeat
              ? "text-green-400"
              : isMiss
                ? "text-red-400"
                : "text-[var(--text-primary)]";

            return (
              <div
                key={q.fiscal_quarter}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
              >
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-page)] transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : q.fiscal_quarter)}
                >
                  {/* Quarter + date */}
                  <div className="w-[4.5rem] shrink-0">
                    <span className="text-sm font-semibold text-[var(--text-primary)] block">
                      {q.fiscal_quarter}
                    </span>
                    {q.report_date && (
                      <span className="text-[10px] text-[var(--text-muted)]">{q.report_date}</span>
                    )}
                  </div>

                  {/* EPS */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[var(--text-muted)] block">EPS</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {q.eps.actual != null ? (
                        <span className={cn("font-mono text-sm font-medium", epsColor)}>
                          ${q.eps.actual.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">—</span>
                      )}
                      {q.eps.surprise_pct != null && (
                        <span
                          className={cn(
                            "text-[10px]",
                            q.eps.surprise_pct > 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {formatPct(q.eps.surprise_pct)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <span className="text-[10px] text-[var(--text-muted)] block">Revenue</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm text-[var(--text-primary)]">
                        {formatRevenue(q.revenue.actual)}
                      </span>
                      {q.revenue.yoy_growth_pct != null && (
                        <span
                          className={cn(
                            "text-[10px]",
                            q.revenue.yoy_growth_pct >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {formatPct(q.revenue.yoy_growth_pct)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="hidden md:flex gap-4 shrink-0">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Gross</span>
                      <span className="font-mono text-sm text-[var(--text-primary)]">
                        {q.gross_margin_pct != null
                          ? `${q.gross_margin_pct.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Op</span>
                      <span className="font-mono text-sm text-[var(--text-primary)]">
                        {q.operating_margin_pct != null
                          ? `${q.operating_margin_pct.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Signals */}
                  <div className="hidden lg:flex flex-wrap gap-1 justify-end ml-2 shrink-0 max-w-[200px]">
                    {q.signals.slice(0, 2).map((s) => (
                      <SignalBadge key={s} signal={s} />
                    ))}
                    {q.signals.length > 2 && (
                      <span className="text-[10px] text-[var(--text-muted)] self-center">
                        +{q.signals.length - 2}
                      </span>
                    )}
                  </div>

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[var(--text-muted)] shrink-0 transition-transform ml-auto",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed mt-3">
                      {q.commentary}
                    </p>

                    {q.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {q.signals.map((s) => (
                          <SignalBadge key={s} signal={s} />
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          EPS YoY
                        </span>
                        <span
                          className={cn(
                            "font-mono text-sm",
                            q.eps_yoy_growth_pct == null
                              ? "text-[var(--text-muted)]"
                              : q.eps_yoy_growth_pct >= 0
                                ? "text-green-400"
                                : "text-red-400"
                          )}
                        >
                          {formatPct(q.eps_yoy_growth_pct)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          Rev QoQ
                        </span>
                        <span
                          className={cn(
                            "font-mono text-sm",
                            q.revenue.qoq_growth_pct == null
                              ? "text-[var(--text-muted)]"
                              : q.revenue.qoq_growth_pct >= 0
                                ? "text-green-400"
                                : "text-red-400"
                          )}
                        >
                          {formatPct(q.revenue.qoq_growth_pct)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          Net Income
                        </span>
                        <span className="font-mono text-sm text-[var(--text-primary)]">
                          {formatRevenue(q.net_income)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          EPS Est
                        </span>
                        <span className="font-mono text-sm text-[var(--text-primary)]">
                          {q.eps.estimate != null ? `$${q.eps.estimate.toFixed(2)}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
