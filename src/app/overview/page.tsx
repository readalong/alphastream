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
  formatSessionDate,
  formatTime,
  isTodaySession,
} from "@/lib/utils";
import Link from "next/link";
import { Activity } from "lucide-react";
import { VixFearGauge } from "@/components/overview/vix-fear-gauge";

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

/* ── Page ── */
export default function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Overview
        </h1>
        <LatestSessionIndicator />
      </div>

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
