"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChart } from "@/hooks/use-chart";
import { useAnalyze } from "@/hooks/use-analyze";
import { useResistance } from "@/hooks/use-resistance";
import { useEarnings } from "@/hooks/use-earnings";
import { EarningsHighlight, EarningsTab } from "@/components/earnings/earnings-components";
import { StaticChart } from "@/components/charts/static-chart";
import { StageBadge } from "@/components/charts/stage-badge";
import { ResistanceChart } from "@/components/resistance/resistance-chart";
import { ResistanceSummaryCard } from "@/components/resistance/resistance-summary-card";
import { SIGNAL_DESCRIPTIONS } from "@/lib/constants";
import { cn, formatPrice, parseCategory, parseSignals } from "@/lib/utils";
import { AlphaLensPanel } from "@/components/alpha-lens/alpha-lens-panel";
import type { AlphaLensContext } from "@/lib/alpha-lens-context";
import { RefreshCw, Brain, ChevronDown, ChevronUp, AlertCircle, Info, Heart, AlertTriangle } from "lucide-react";
import { useFavoritesStore } from "@/stores/favorites-store";
import { TickerNewsPanel, NewsTickerCard } from "@/components/news/ticker-news-panel";
import { ChartStudioPanel } from "@/components/ticker/chart-studio-panel";
import type { ScreenerResult, AiAnalysis, ChartResponse, ResistanceResponse, EarningsResponse } from "@/lib/types";

type Tab = "technical" | "resistance" | "news" | "earnings" | "chart";

function BusinessSummaryCard({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = summary.length > 200;
  const display = isLong && !expanded ? summary.slice(0, 200) + "..." : summary;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
        Business Summary
      </h3>
      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
        {display}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-xs text-[var(--accent)] hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function ScreenerCard({ screener }: { screener: ScreenerResult }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Screener
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)] text-sm">Price</span>
          <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
            ${formatPrice(screener.close_price)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] text-sm">Stage</span>
          <span className="text-sm text-[var(--text-primary)]">{screener.stage}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] text-sm">Category</span>
          <StageBadge category={parseCategory(screener.category)} />
        </div>
        {screener.sector && (
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)] text-sm">Sector</span>
            <Link
              href={`/sectors/${screener.sector_etf}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {screener.sector} ({screener.sector_etf})
            </Link>
          </div>
        )}
        {screener.industry && (
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)] text-sm">Industry</span>
            <Link
              href={`/sectors/${screener.sector_etf}/${encodeURIComponent(screener.industry)}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {screener.industry}
            </Link>
          </div>
        )}
        {screener.signals && (
          <div>
            <span className="text-[var(--text-muted)] text-sm block mb-1.5">Signals</span>
            <div className="flex flex-wrap gap-1.5">
              {parseSignals(screener.signals).map((signal) => (
                <span
                  key={signal}
                  className="px-2 py-0.5 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AiAnalysisCard({ analysis }: { analysis: AiAnalysis }) {
  if (analysis.error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-[var(--bg-card)] p-4">
        <h3 className="text-sm font-semibold text-red-400 mb-2">AI Analysis Error</h3>
        <p className="text-sm text-[var(--text-muted)]">{analysis.message || analysis.error}</p>
      </div>
    );
  }

  const verdict = analysis.decision?.verdict || "";
  const confidence = analysis.decision?.confidence_score;
  const verdictColor =
    verdict === "APPROVE"
      ? "text-green-400"
      : verdict === "REJECT"
        ? "text-red-400"
        : "text-amber-400";

  const verdictLabel =
    verdict === "APPROVE"
      ? "APPROVED"
      : verdict === "REJECT"
        ? "REJECTED"
        : verdict || "—";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        AI Analysis
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] text-sm">Verdict</span>
          <span className={`font-semibold ${verdictColor}`}>{verdictLabel}</span>
        </div>
        {confidence != null && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-muted)] text-sm">Confidence</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">{confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${confidence}%`,
                  background:
                    confidence >= 70
                      ? "#22c55e"
                      : confidence >= 40
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
          </div>
        )}
        {analysis.decision?.weighted_rationale && (
          <div>
            <span className="text-[var(--text-muted)] text-sm block mb-1">Score Breakdown</span>
            <p className="text-xs text-[var(--text-primary)] font-mono leading-relaxed">
              {analysis.decision.weighted_rationale}
            </p>
          </div>
        )}
        {analysis.visual_audit && (
          <div className="pt-2 border-t border-[var(--border)]">
            <span className="text-[var(--text-muted)] text-sm block mb-2">Visual Audit</span>
            <div className="grid grid-cols-3 gap-2">
              {analysis.visual_audit.trend_structure && (
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Trend</span>
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {analysis.visual_audit.trend_structure}
                  </p>
                </div>
              )}
              {analysis.visual_audit.key_levels && (
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Levels</span>
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {analysis.visual_audit.key_levels}
                  </p>
                </div>
              )}
              {analysis.visual_audit.obv_analysis && (
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">OBV</span>
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {analysis.visual_audit.obv_analysis}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {analysis.reasoning && (
          <div className="pt-2 border-t border-[var(--border)]">
            <span className="text-[var(--text-muted)] text-sm block mb-1">Reasoning</span>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {analysis.reasoning}
            </p>
          </div>
        )}
        {(analysis.screener_stage || analysis.screener_signals) && (
          <div className="pt-2 border-t border-[var(--border)] flex flex-wrap gap-1.5">
            {analysis.screener_stage && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                {analysis.screener_stage}
              </span>
            )}
            {analysis.screener_signals && (
              <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {analysis.screener_signals}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SignalDetails({ signals }: { signals: string }) {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseSignals(signals);
  const known = parsed.filter((s) => SIGNAL_DESCRIPTIONS[s]);

  if (known.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider"
      >
        Technical Signals
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {known.map((signal) => {
            const desc = SIGNAL_DESCRIPTIONS[signal];
            return (
              <div key={signal}>
                <p className="text-sm font-medium text-[var(--text-primary)]">{desc.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useElapsedSeconds(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return elapsed;
}

function AiLoadingCard({ elapsed }: { elapsed: number }) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `${seconds}s`;

  return (
    <div className="rounded-lg border border-purple-500/20 bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-purple-400">
          <Brain className="h-4 w-4 animate-pulse" />
          <span className="font-medium">Running AI Analysis...</span>
        </div>
        <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
          {timeStr}
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 rounded bg-purple-500/10 animate-pulse" />
        <div className="h-3 w-full rounded bg-purple-500/10 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-purple-500/10 animate-pulse" />
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-3">
        AI analysis can take up to 2 minutes depending on model load.
      </p>
    </div>
  );
}

function AiErrorCard({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2 text-sm text-red-400 mb-2">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Analysis Failed</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3">{error.message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
      >
        <Brain className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

function DecisionSummaryCard({
  screener,
  aiAnalysis,
  resistanceData,
  earningsData,
  onViewResistance,
  onViewEarnings,
}: {
  screener: ScreenerResult;
  aiAnalysis: AiAnalysis | null;
  resistanceData: ResistanceResponse | null;
  earningsData: EarningsResponse | null;
  onViewResistance: () => void;
  onViewEarnings: () => void;
}) {
  const cat = parseCategory(screener.category);
  const price = screener.close_price;

  // AI verdict
  const verdict = aiAnalysis?.decision?.verdict;
  const confidence = aiAnalysis?.decision?.confidence_score;
  const verdictColor = verdict === "APPROVE" ? "text-emerald-400" : verdict === "REJECT" ? "text-red-400" : "text-amber-400";

  // Resistance R1
  const r1 = resistanceData?.levels?.[0];
  const r1Pct = r1 && price > 0 ? ((r1.price - price) / price) * 100 : null;

  // Earnings
  const nextEarnings = earningsData?.next_earnings;
  const earningsDays = nextEarnings?.date_range[0]
    ? Math.ceil((new Date(nextEarnings.date_range[0]).getTime() - Date.now()) / 86400000)
    : null;


  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 mb-4">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {/* Price + category */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
            ${formatPrice(price)}
          </span>
          <StageBadge category={cat} />
          {screener.sector && (
            <Link href={`/sectors/${screener.sector_etf}`} className="text-xs text-[var(--accent)] hover:underline truncate">
              {screener.sector_etf}
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 ml-auto text-sm">
          {/* AI verdict */}
          {verdict && confidence != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--text-muted)]">AI</span>
              <span className={cn("font-semibold text-xs", verdictColor)}>{verdict}</span>
              <span className="text-xs text-[var(--text-muted)]">{confidence}%</span>
            </div>
          )}

          {/* R1 */}
          {r1 && r1Pct != null && (
            <div className="flex items-center gap-1.5">
              <button onClick={onViewResistance} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]">R1</button>
              <span className="text-xs font-medium tabular-nums text-[var(--text-primary)]">${r1.price.toFixed(2)}</span>
              <span className={cn("text-xs tabular-nums", r1Pct > 0 ? "text-emerald-400" : "text-red-400")}>
                ({r1Pct > 0 ? "+" : ""}{r1Pct.toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Earnings */}
          {earningsDays != null && earningsDays >= 0 && earningsDays <= 60 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onViewEarnings}
                className={cn(
                  "text-xs hover:underline",
                  earningsDays <= 14 ? "text-amber-400 font-semibold" : "text-[var(--text-muted)]"
                )}
              >
                Earnings
              </button>
              <span className={cn("text-xs tabular-nums", earningsDays <= 14 ? "text-amber-400" : "text-[var(--text-muted)]")}>
                {earningsDays}d
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FavoriteButton({ ticker, screener }: { ticker: string; screener?: ScreenerResult }) {
  const { favorites, toggleFavorite } = useFavoritesStore();
  const isFav = favorites.some((f) => f.ticker === ticker);

  return (
    <button
      onClick={() =>
        toggleFavorite(
          ticker,
          screener?.sector || "",
          screener?.sector_etf || ""
        )
      }
      className={cn(
        "p-1.5 rounded-md transition-all duration-200 hover:scale-110 active:scale-90",
        isFav
          ? "text-rose-500"
          : "text-[var(--text-muted)]/40 hover:text-rose-400"
      )}
      title={isFav ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Heart
        className="h-5 w-5 transition-colors duration-200"
        fill={isFav ? "currentColor" : "none"}
      />
    </button>
  );
}

export default function TickerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const symbol = (params.symbol as string).toUpperCase();

  const rawTab = searchParams.get("tab");
  const initialTab: Tab =
    rawTab === "resistance" ? "resistance"
    : rawTab === "earnings"  ? "earnings"
    : rawTab === "chart"     ? "chart"
    : rawTab === "news"      ? "news"
    : "technical";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [aiEnabled, setAiEnabled] = useState(false);

  const { data: chartData, isLoading: chartLoading, refetch: refetchChart } = useChart(symbol);
  const {
    data: analyzeData,
    isLoading: analyzeLoading,
    isFetching: analyzeFetching,
    error: analyzeError,
    refetch: refetchAnalyze,
  } = useAnalyze(symbol, aiEnabled);

  const screener = analyzeData?.screener || chartData?.screener;
  const isStage2 = screener ? parseCategory(screener.category) === "2" || ["S", "A"].includes(parseCategory(screener.category)) : false;

  const {
    data: resistanceData,
    isLoading: resistanceLoading,
  } = useResistance(symbol, activeTab === "resistance");

  const {
    data: earningsData,
    isLoading: earningsLoading,
    error: earningsError,
  } = useEarnings(symbol);
  const earningsUnsupported =
    earningsError instanceof Error && earningsError.message.includes("422");

  const elapsed = useElapsedSeconds(analyzeFetching);

  const chartBase64 = analyzeData?.chart_base64 || chartData?.chart_base64;
  const businessSummary = chartData?.business_summary;
  const aiAnalysis = analyzeData?.ai_analysis ?? null;
  const showSkeleton = chartLoading && !chartData;

  const earningsContext = (() => {
    const dateStr = earningsData?.next_earnings?.date_range[0];
    if (!dateStr) return undefined;
    const daysUntil = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (daysUntil < 0 || daysUntil > 60) return undefined;
    return { daysUntil, dateStr, epsEstimate: earningsData?.next_earnings?.eps_estimate };
  })();

  const alphaLensContext: AlphaLensContext = {
    ticker: symbol,
    screener: screener || undefined,
    businessSummary: businessSummary || undefined,
    aiAnalysis: aiAnalysis || undefined,
    resistance: resistanceData
      ? { currentPrice: resistanceData.current_price, levels: resistanceData.levels }
      : undefined,
    earnings: earningsContext,
    hasChart: !!chartBase64,
  };

  const tabs: { key: Tab; label: string; shortLabel: string; disabled?: boolean }[] = [
    { key: "technical",  label: "Technical Analysis", shortLabel: "Technical" },
    { key: "chart",      label: "Chart Studio",        shortLabel: "Chart" },
    { key: "resistance", label: "Resistance",          shortLabel: "Resistance" },
    { key: "earnings",   label: "Earnings",            shortLabel: "Earnings",  disabled: earningsUnsupported },
    { key: "news",       label: "News",                shortLabel: "News" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">{symbol}</h1>
          {screener && <StageBadge category={parseCategory(screener.category)} />}
          <FavoriteButton ticker={symbol} screener={screener} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab === "technical" && (
            <button
              onClick={() => {
                if (aiEnabled) refetchAnalyze();
                else setAiEnabled(true);
              }}
              disabled={analyzeFetching}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
            >
              <Brain className={`h-4 w-4 ${analyzeFetching ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">
                {analyzeFetching ? "Analyzing..." : aiAnalysis ? "Re-run AI" : "Run AI"}
              </span>
            </button>
          )}
          <button
            onClick={() => refetchChart()}
            className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Decision Summary */}
      {screener && (
        <DecisionSummaryCard
          screener={screener}
          aiAnalysis={aiAnalysis}
          resistanceData={resistanceData ?? null}
          earningsData={earningsData ?? null}
          onViewResistance={() => setActiveTab("resistance")}
          onViewEarnings={() => setActiveTab("earnings")}
        />
      )}

      {/* Tab bar */}
      <div className="flex gap-0.5 mb-4 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            disabled={t.disabled}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === t.key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : t.disabled
                  ? "border-transparent text-[var(--text-muted)]/50 cursor-not-allowed"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="sm:hidden">{t.shortLabel}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Earnings proximity warning */}
      {earningsData?.next_earnings && (() => {
        const dateStr = earningsData.next_earnings.date_range[0];
        if (!dateStr) return null;
        const daysUntil = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
        if (daysUntil < 0 || daysUntil > 14) return null;
        return (
          <div className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-semibold">Earnings in {daysUntil} day{daysUntil !== 1 ? "s" : ""}</span>
              {" "}({dateStr}) — avoid new entries, elevated IV risk.
              {earningsData.next_earnings.eps_estimate != null && (
                <span className="text-amber-400/80 ml-1">
                  EPS est: ${earningsData.next_earnings.eps_estimate.toFixed(2)}
                </span>
              )}
            </p>
            <button
              onClick={() => setActiveTab("earnings")}
              className="ml-auto shrink-0 text-xs text-amber-400 hover:underline whitespace-nowrap"
            >
              View Earnings →
            </button>
          </div>
        );
      })()}

      {/* Technical Analysis tab */}
      {activeTab === "technical" && (
        <>
          {showSkeleton ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 h-96 rounded-lg bg-[var(--bg-card)] animate-pulse" />
              <div className="lg:col-span-2 h-96 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            </div>
          ) : chartData || analyzeData ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                {chartBase64 && (
                  <StaticChart base64={chartBase64} alt={`${symbol} chart`} />
                )}
                {screener?.signals && <SignalDetails signals={screener.signals} />}
              </div>
              <div className="lg:col-span-2 space-y-4">
                {businessSummary && <BusinessSummaryCard summary={businessSummary} />}
                {screener && <ScreenerCard screener={screener} />}
                {earningsData && !earningsUnsupported && (
                  <EarningsHighlight
                    data={earningsData}
                    onViewEarnings={() => setActiveTab("earnings")}
                  />
                )}
                <NewsTickerCard ticker={symbol} onMoreNews={() => setActiveTab("news")} />
                {analyzeFetching && <AiLoadingCard elapsed={elapsed} />}
                {analyzeError && !analyzeFetching && (
                  <AiErrorCard
                    error={analyzeError}
                    onRetry={() => refetchAnalyze()}
                  />
                )}
                {aiAnalysis && !analyzeFetching && (
                  <AiAnalysisCard analysis={aiAnalysis} />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[var(--text-muted)]">
                No data available for {symbol}. The backend may be unreachable.
              </p>
            </div>
          )}
        </>
      )}

      {/* News tab */}
      {activeTab === "news" && (
        <TickerNewsPanel ticker={symbol} />
      )}

      {/* Chart Studio tab */}
      {activeTab === "chart" && (
        <ChartStudioPanel symbol={symbol} />
      )}

      {/* Earnings tab */}
      {activeTab === "earnings" && (
        <>
          {earningsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-[var(--bg-card)] animate-pulse" />
              ))}
            </div>
          ) : earningsData ? (
            <EarningsTab data={earningsData} />
          ) : (
            <div className="text-center py-20">
              <p className="text-[var(--text-muted)]">
                No earnings data available for {symbol}.
              </p>
            </div>
          )}
        </>
      )}

      {/* Alpha Lens floating chat */}
      <AlphaLensPanel context={alphaLensContext} />

      {/* Resistance tab */}
      {activeTab === "resistance" && (
        <>
          {!isStage2 && screener && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
              <p className="text-sm text-blue-400">
                Resistance analysis focuses on Stage 2 uptrend stocks. This stock is currently in{" "}
                {screener.stage || `Stage ${parseCategory(screener.category)}`}.
              </p>
            </div>
          )}

          {resistanceLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 h-96 rounded-lg bg-[var(--bg-card)] animate-pulse" />
              <div className="lg:col-span-2 h-64 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            </div>
          ) : resistanceData ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <ResistanceChart ticker={symbol} />
              </div>
              <div className="lg:col-span-2">
                <ResistanceSummaryCard
                  ticker={symbol}
                  data={resistanceData}
                  stage={screener?.stage}
                  category={screener ? parseCategory(screener.category) : undefined}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[var(--text-muted)]">
                No resistance data available for {symbol}.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
