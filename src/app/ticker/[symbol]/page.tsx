"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChart } from "@/hooks/use-chart";
import { useAnalyze } from "@/hooks/use-analyze";
import { useResistance } from "@/hooks/use-resistance";
import { StaticChart } from "@/components/charts/static-chart";
import { StageBadge } from "@/components/charts/stage-badge";
import { ResistanceChart } from "@/components/resistance/resistance-chart";
import { ResistanceSummaryCard } from "@/components/resistance/resistance-summary-card";
import { SIGNAL_DESCRIPTIONS } from "@/lib/constants";
import { cn, formatPrice, parseCategory, parseSignals } from "@/lib/utils";
import { AlphaLensPanel } from "@/components/alpha-lens/alpha-lens-panel";
import type { AlphaLensContext } from "@/lib/alpha-lens-context";
import { RefreshCw, Brain, ChevronDown, ChevronUp, AlertCircle, Info, Heart } from "lucide-react";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { ScreenerResult, AiAnalysis, ChartResponse } from "@/lib/types";

type Tab = "technical" | "resistance";

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

  const initialTab = searchParams.get("tab") === "resistance" ? "resistance" : "technical";
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

  const elapsed = useElapsedSeconds(analyzeFetching);

  const chartBase64 = analyzeData?.chart_base64 || chartData?.chart_base64;
  const businessSummary = chartData?.business_summary;
  const aiAnalysis = analyzeData?.ai_analysis ?? null;
  const showSkeleton = chartLoading && !chartData;

  const alphaLensContext: AlphaLensContext = {
    ticker: symbol,
    screener: screener || undefined,
    businessSummary: businessSummary || undefined,
    aiAnalysis: aiAnalysis || undefined,
    resistance: resistanceData
      ? { currentPrice: resistanceData.current_price, levels: resistanceData.levels }
      : undefined,
    hasChart: !!chartBase64,
  };

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "technical", label: "Technical Analysis" },
    { key: "resistance", label: "Resistance" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{symbol}</h1>
          {screener && <StageBadge category={parseCategory(screener.category)} />}
          <FavoriteButton ticker={symbol} screener={screener} />
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "technical" && (
            <button
              onClick={() => {
                if (aiEnabled) refetchAnalyze();
                else setAiEnabled(true);
              }}
              disabled={analyzeFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
            >
              <Brain className={`h-4 w-4 ${analyzeFetching ? "animate-pulse" : ""}`} />
              {analyzeFetching
                ? "Analyzing..."
                : aiAnalysis
                  ? "Re-run AI Analysis"
                  : "Run AI Analysis"}
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

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            disabled={t.disabled}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : t.disabled
                  ? "border-transparent text-[var(--text-muted)]/50 cursor-not-allowed"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
