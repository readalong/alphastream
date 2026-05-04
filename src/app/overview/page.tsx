"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSessions } from "@/hooks/use-sessions";
import { api } from "@/lib/api-client";
import { NativeReportRenderer } from "@/components/overview/native-report-renderer";
import { GlobalMarketsPanel } from "@/components/overview/global-markets-panel";
import { useUptrendReport } from "@/hooks/use-uptrend-report";
import { NewsFeedPanel } from "@/components/news/news-feed-panel";
import {
  useRegime,
  useRecommendations,
  useOpenPositions,
  usePendingBreakouts,
  useRecommendationHistory,
} from "@/hooks/use-recommendations";
import {
  formatSessionDate,
  formatTime,
  isTodaySession,
  cn,
} from "@/lib/utils";
import Link from "next/link";
import { Activity, AlertTriangle, Clock, TrendingUp, ChevronRight, Target } from "lucide-react";
import { VixFearGauge } from "@/components/overview/vix-fear-gauge";

/* ── Today's Focus Panel ── */
function TodayFocusPanel() {
  const regime = useRegime();
  const recs = useRecommendations();
  const positions = useOpenPositions();
  const pending = usePendingBreakouts(true);

  const regimeData = regime.data;
  const data = recs.data;
  const openPositions = positions.data?.positions ?? [];
  const pendingBreakouts = pending.data?.pending ?? data?.pending_breakouts ?? [];

  // Action required: sell signals + positions near stop
  const sellSignals = data?.sell_signals ?? [];

  // Top buy opportunity
  const topBuy = data?.buy_recommendations?.[0];

  // Loading state
  if (regime.isLoading && recs.isLoading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
        <div className="h-4 w-48 rounded bg-[var(--bg-primary)] animate-pulse" />
        <div className="h-3 w-full rounded bg-[var(--bg-primary)] animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-[var(--bg-primary)] animate-pulse" />
      </div>
    );
  }

  if (!regimeData && !data) return null;

  const regimeColor =
    regimeData?.regime === "GREEN" ? { bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400", text: "text-emerald-400" }
    : regimeData?.regime === "RED" ? { bg: "bg-red-500/10", border: "border-red-500/25", dot: "bg-red-400", text: "text-red-400" }
    : { bg: "bg-amber-500/10", border: "border-amber-500/25", dot: "bg-amber-400", text: "text-amber-400" };

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className={cn("flex items-center justify-between px-5 py-3 border-b border-[var(--border)]", regimeData ? regimeColor.bg : "")}>
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Today's Focus</h2>
          {regimeData && (
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full animate-pulse shrink-0", regimeColor.dot)} />
              <span className={cn("text-xs font-bold tracking-wider", regimeColor.text)}>
                {regimeData.regime}
              </span>
              {regimeData.breadth && (
                <span className="text-xs text-[var(--text-muted)]">
                  · {regimeData.breadth.pct_above_50sma.toFixed(0)}% above 50d
                </span>
              )}
            </div>
          )}
        </div>
        <Link href="/recommendations" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5">
          Full Report <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Action required */}
        {sellSignals.length > 0 && (
          <div>
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Action Required ({sellSignals.length})
            </p>
            <div className="space-y-1.5">
              {sellSignals.slice(0, 3).map((sig) => (
                <div key={sig.ticker} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
                      {sig.action}
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--text-primary)] shrink-0">{sig.ticker}</span>
                    <span className="text-xs text-[var(--text-muted)] truncate">{sig.reason}</span>
                  </div>
                  <Link href={`/ticker/${sig.ticker}`} className="text-xs text-[var(--accent)] hover:underline shrink-0">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitor: pending breakouts */}
        {pendingBreakouts.length > 0 && (
          <div>
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Monitor ({pendingBreakouts.length})
            </p>
            <div className="space-y-1.5">
              {pendingBreakouts.slice(0, 3).map((b) => {
                const confirmed = b.closes_in_direction >= b.days_required;
                const progress = b.days_required > 0 ? (b.closes_in_direction / b.days_required) * 100 : 100;
                return (
                  <div key={b.ticker} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm font-bold text-[var(--text-primary)] shrink-0">{b.ticker}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", confirmed ? "bg-emerald-500" : "bg-amber-400")}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">{b.closes_in_direction}/{b.days_required}d</span>
                        {confirmed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">READY</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/ticker/${b.ticker}`} className="text-xs text-[var(--accent)] hover:underline shrink-0">
                      View →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {topBuy && (
          <div>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Top Opportunity
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-sm font-bold text-[var(--text-primary)] shrink-0">{topBuy.ticker}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                  {topBuy.conviction.tier?.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate">{topBuy.sector}</span>
                {data?.buy_recommendations && data.buy_recommendations.length > 1 && (
                  <span className="text-xs text-[var(--text-muted)] shrink-0">
                    +{data.buy_recommendations.length - 1} more
                  </span>
                )}
              </div>
              <Link href="/recommendations" className="text-xs text-[var(--accent)] hover:underline shrink-0">
                View All →
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {sellSignals.length === 0 && pendingBreakouts.length === 0 && !topBuy && (
          <p className="text-sm text-[var(--text-muted)] text-center py-2">
            No actionable signals today.{" "}
            <Link href="/recommendations" className="text-[var(--accent)] hover:underline">
              Run engine →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

/* ── Session indicator ── */
function LatestSessionIndicator() {
  const { data: sessions } = useSessions();
  const latest = sessions?.[0];
  if (!latest) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
      <span>{formatSessionDate(latest.session_id)}</span>
      {isTodaySession(latest.session_id) && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
          Today
        </span>
      )}
      <span className="hidden sm:inline">
        · {formatTime(latest.created_at)}
      </span>
    </div>
  );
}

/* ── AI Report — hero section (falls back to older sessions on 404) ── */
function AiReportSection() {
  const { data: sessions } = useSessions();
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const aiSessions = sessions?.filter((s) => s.has_ai_analysis) ?? [];
  const session = aiSessions.find((s) => !failedIds.has(s.session_id));

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ["session-report", session?.session_id],
    queryFn: () => api.sessionReport(session!.session_id),
    enabled: !!session,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (isError && session) {
      setFailedIds((prev) => new Set(prev).add(session.session_id));
    }
  }, [isError, session]);

  if (!session) return null;

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Market Environment Report
          </h2>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {formatSessionDate(session.session_id)}
        </span>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-[var(--bg-primary)] animate-pulse" />
            <div className="h-4 w-full rounded bg-[var(--bg-primary)] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[var(--bg-primary)] animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-[var(--bg-primary)] animate-pulse" />
          </div>
        ) : report ? (
          <NativeReportRenderer report={report} />
        ) : null}
      </div>
    </section>
  );
}

/* ── ATH Stocks callout ── */
function AthStocksCard() {
  const { data: sessions } = useSessions();
  const latestSession = sessions?.[0];
  const { data: report } = useUptrendReport(latestSession?.session_id || null);

  if (!report || report.summary.at_ath_no_resistance === 0) return null;

  const athStocks = report.stocks.filter((s) => !s.has_resistance).slice(0, 8);

  return (
    <section className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
      <h2 className="text-sm font-semibold text-green-400 mb-1">
        At All-Time Highs
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        {report.summary.at_ath_no_resistance} Stage 2 stocks with no overhead resistance — clear runway above.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {athStocks.map((s) => (
          <Link
            key={s.ticker}
            href={`/ticker/${s.ticker}`}
            className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
          >
            {s.ticker}
          </Link>
        ))}
      </div>
      <Link
        href="/uptrend?view=at_ath"
        className="text-xs text-[var(--accent)] hover:underline"
      >
        View All &rarr;
      </Link>
    </section>
  );
}

/* ── What Changed Strip ── */
function WhatChangedStrip() {
  const { data } = useRecommendationHistory(3);
  const days = data?.days ?? [];
  if (days.length < 2) return null;

  const today = days[0];
  const yesterday = days[1];

  const buyDiff = today.buy_count - yesterday.buy_count;
  const sellDiff = today.sell_count - yesterday.sell_count;
  const pendingDiff = today.pending_count - yesterday.pending_count;
  const regimeChanged = today.regime !== yesterday.regime;

  const hasChanges = buyDiff !== 0 || sellDiff !== 0 || pendingDiff !== 0 || regimeChanged;
  if (!hasChanges) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      <span className="text-[var(--text-muted)] font-medium shrink-0">Since yesterday:</span>
      {regimeChanged && (
        <span className="font-medium">
          <span className="text-[var(--text-muted)]">Regime </span>
          <span className="text-amber-400">{yesterday.regime} → {today.regime}</span>
        </span>
      )}
      {buyDiff !== 0 && (
        <span className={buyDiff > 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
          {buyDiff > 0 ? "+" : ""}{buyDiff} buy signal{Math.abs(buyDiff) !== 1 ? "s" : ""}
        </span>
      )}
      {sellDiff !== 0 && (
        <span className={sellDiff > 0 ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
          {sellDiff > 0 ? "+" : ""}{sellDiff} sell signal{Math.abs(sellDiff) !== 1 ? "s" : ""}
        </span>
      )}
      {pendingDiff !== 0 && (
        <span className={pendingDiff > 0 ? "text-amber-400 font-medium" : "text-[var(--text-muted)]"}>
          {pendingDiff > 0 ? "+" : ""}{pendingDiff} pending
        </span>
      )}
      <Link href="/recommendations" className="ml-auto shrink-0 text-[var(--accent)] hover:underline">
        View →
      </Link>
    </div>
  );
}

/* ── Page ── */
export default function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
          Overview
        </h1>
        <LatestSessionIndicator />
      </div>

      {/* Today's Focus — action items */}
      <TodayFocusPanel />

      {/* What changed since yesterday */}
      <WhatChangedStrip />

      {/* AI Report — hero position */}
      <AiReportSection />

      {/* VIX Fear Gauge */}
      <VixFearGauge />

      {/* Global Markets */}
      <GlobalMarketsPanel />

      {/* ATH highlights */}
      <AthStocksCard />

      {/* News feed */}
      <NewsFeedPanel />
    </div>
  );
}
