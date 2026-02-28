"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Globe, TrendingUp, Zap, BarChart3, FileText, Sparkles } from "lucide-react";
import { useGlobalReport } from "@/hooks/use-global-report";
import { useChart } from "@/hooks/use-chart";
import { StaticChart } from "@/components/charts/static-chart";
import {
  getCountryFlag, getStageKey, formatPct, formatUpdated,
  BIAS_STYLES, REGIME_STYLES, APPETITE_COLORS,
  GlobalSynthesisCard, RegionLabel,
} from "@/components/overview/global-markets-panel";
import { STAGE_COLORS } from "@/lib/constants";
import type { GlobalIndexEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGION_ORDER: Array<GlobalIndexEntry["region"]> = ["Asia Pacific", "Europe"];

// ── Index card (selectable, used on the markets page left column) ──────────

function IndexCard({
  entry, isSelected, onClick,
}: {
  entry: GlobalIndexEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { screening, ai_analysis, name, ticker, country } = entry;
  const pct5d    = screening.pct_chg_5d;
  const stageKey = getStageKey(screening.stage);
  const stageInfo = stageKey ? STAGE_COLORS[stageKey] : null;
  const bias      = ai_analysis?.market_signal?.bias;
  const hasAI     = !!(ai_analysis?.trend_analysis || ai_analysis?.market_signal || ai_analysis?.summary);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg border bg-[var(--bg-card)] p-3.5 text-left w-full",
        "flex flex-col gap-2.5 overflow-hidden transition-all duration-150",
        isSelected
          ? "border-[var(--accent)]/60 bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20"
          : "border-[var(--border)] hover:border-[var(--accent)]/40",
      )}
    >
      {stageInfo && (
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: stageInfo.color }} />
      )}
      {hasAI && (
        <Sparkles className={cn(
          "absolute top-2.5 right-2.5 h-3 w-3 transition-colors",
          isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]/50",
        )} />
      )}

      <div className="pr-5">
        <span className="text-xl leading-none">{getCountryFlag(country)}</span>
        <div className="mt-1.5">
          <div className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight truncate">{name}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{ticker}</div>
        </div>
      </div>

      <div>
        <div className={cn(
          "text-[22px] font-bold tabular-nums leading-none",
          pct5d == null ? "text-[var(--text-muted)]"
            : pct5d >= 0 ? "text-green-400" : "text-red-400",
        )}>
          {formatPct(pct5d)}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mt-0.5">5-day</div>
      </div>

      <div className="flex items-center gap-1.5">
        {(["50", "200"] as const).map((p) => {
          const pos = p === "50" ? screening.sma50_position : screening.sma200_position;
          return (
            <div key={p} className="flex items-center gap-1">
              <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">{p}</span>
              <div className={cn("w-1.5 h-1.5 rounded-full",
                pos === "Above" ? "bg-green-400" : pos === "Below" ? "bg-red-400" : "bg-[var(--text-muted)]"
              )} />
            </div>
          );
        })}
        {screening.rsi_14 != null && (
          <span className="text-[9px] text-[var(--text-muted)] ml-auto font-mono">RSI {Math.round(screening.rsi_14)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-auto">
        {stageInfo && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide"
            style={{ color: stageInfo.color, backgroundColor: `${stageInfo.color}15`, borderColor: `${stageInfo.color}30` }}>
            {stageInfo.label}
          </span>
        )}
        {bias && (
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide", BIAS_STYLES[bias])}>
            {bias}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Section helpers ────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon className="h-3 w-3 text-[var(--accent)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-[var(--text-muted)] w-28 shrink-0">{label}</span>
      <span className="text-[var(--text-primary)] leading-relaxed">{value}</span>
    </div>
  );
}

// ── Index detail panel (right column) ─────────────────────────────────────

function IndexDetail({ entry }: { entry: GlobalIndexEntry }) {
  const { screening, ai_analysis, name, ticker, country } = entry;
  const { data: chartData, isLoading: chartLoading } = useChart(ticker);

  const stageKey  = getStageKey(screening.stage);
  const stageInfo = stageKey ? STAGE_COLORS[stageKey] : null;
  const bias      = ai_analysis?.market_signal?.bias;
  const confidence = ai_analysis?.market_signal?.confidence;
  const hasAI     = !!(ai_analysis?.trend_analysis || ai_analysis?.market_signal || ai_analysis?.implications || ai_analysis?.summary);

  return (
    <div className="space-y-3">
      {/* Identity + Stats */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl leading-none mt-0.5">{getCountryFlag(country)}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-primary)] leading-tight">{name}</h2>
            <span className="text-xs text-[var(--text-muted)] font-mono">{ticker}</span>
          </div>
          {bias && (
            <span className={cn("shrink-0 text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wide", BIAS_STYLES[bias])}>
              {bias}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          {screening.close_price != null && (
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Price</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">
                {screening.close_price >= 1000
                  ? screening.close_price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : screening.close_price.toFixed(2)}
              </div>
            </div>
          )}
          {[
            { key: "1D", val: screening.pct_chg_1d },
            { key: "5D", val: screening.pct_chg_5d },
            { key: "20D", val: screening.pct_chg_20d },
          ].map(({ key, val }) => val != null && (
            <div key={key}>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">{key}</div>
              <div className={cn("text-sm font-bold tabular-nums", val >= 0 ? "text-green-400" : "text-red-400")}>
                {formatPct(val)}
              </div>
            </div>
          ))}
          {screening.rsi_14 != null && (
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">RSI 14</div>
              <div className={cn(
                "text-sm font-bold tabular-nums",
                screening.rsi_14 > 70 ? "text-red-400"
                  : screening.rsi_14 < 30 ? "text-green-400"
                  : "text-[var(--text-primary)]",
              )}>
                {screening.rsi_14.toFixed(1)}
              </div>
            </div>
          )}
          {stageInfo && (
            <div className="ml-auto self-end">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide"
                style={{ color: stageInfo.color, backgroundColor: `${stageInfo.color}15`, borderColor: `${stageInfo.color}30` }}>
                {stageInfo.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        {chartLoading ? (
          <div className="h-72 w-full rounded-lg bg-[var(--bg-primary)] animate-pulse" />
        ) : chartData?.chart_base64 ? (
          <StaticChart base64={chartData.chart_base64} alt={`${ticker} chart`} />
        ) : (
          <div className="h-32 flex items-center justify-center rounded-lg bg-[var(--bg-primary)]">
            <p className="text-xs text-[var(--text-muted)]">Chart not available for {ticker}</p>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      {hasAI && (
        <div className="space-y-2">
          {ai_analysis?.trend_analysis && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <SectionLabel icon={TrendingUp} label="Trend Analysis" />
              <div className="space-y-1.5">
                <AnalysisRow label="Stage"         value={ai_analysis.trend_analysis.current_stage} />
                <AnalysisRow label="Strength"      value={ai_analysis.trend_analysis.trend_strength} />
                <AnalysisRow label="SMA Alignment" value={ai_analysis.trend_analysis.sma_alignment} />
                <AnalysisRow label="Momentum"      value={ai_analysis.trend_analysis.momentum} />
              </div>
            </div>
          )}

          {ai_analysis?.market_signal && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <SectionLabel icon={Zap} label="Market Signal" />
              <div className="flex items-center gap-3 mb-2.5">
                {bias && (
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide", BIAS_STYLES[bias])}>
                    {bias}
                  </span>
                )}
                {confidence != null && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full",
                          bias === "BULLISH" ? "bg-green-400"
                            : bias === "BEARISH" ? "bg-red-400"
                            : "bg-amber-400",
                        )}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums w-8 text-right shrink-0">
                      {confidence}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {ai_analysis.market_signal.risk_environment}
              </p>
            </div>
          )}

          {ai_analysis?.implications && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <SectionLabel icon={BarChart3} label="Implications" />
              <div className="space-y-3">
                {[
                  { label: "Stock Selection", val: ai_analysis.implications.stock_selection },
                  { label: "Sector Rotation", val: ai_analysis.implications.sector_rotation },
                  { label: "Key Levels",      val: ai_analysis.implications.key_levels },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</div>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai_analysis?.summary && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <SectionLabel icon={FileText} label="Summary" />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">{ai_analysis.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] flex flex-col items-center justify-center py-24 text-center px-6">
      <Globe className="h-8 w-8 text-[var(--text-muted)]/40 mb-3" />
      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Select an index</p>
      <p className="text-xs text-[var(--text-muted)]">
        Click any index card to load its chart and AI analysis
      </p>
    </div>
  );
}

// ── Page content (needs Suspense for useSearchParams) ─────────────────────

function GlobalMarketsContent() {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useGlobalReport();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // Auto-select index from URL param (e.g. /markets?index=%5EN225)
  useEffect(() => {
    const index = searchParams.get("index");
    if (index && data?.indexes[index]) {
      setSelectedTicker(index);
    }
  }, [searchParams, data]);

  const updated = data ? formatUpdated(data.generated_at) : null;

  const byRegion = data
    ? Object.values(data.indexes).reduce((acc, entry) => {
        if (!acc[entry.region]) acc[entry.region] = [];
        acc[entry.region].push(entry);
        return acc;
      }, {} as Record<string, GlobalIndexEntry[]>)
    : {} as Record<string, GlobalIndexEntry[]>;

  const selectedEntry = selectedTicker ? (data?.indexes[selectedTicker] ?? null) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Global Markets</h1>
        </div>
        {updated && (
          <span className={cn("text-xs tabular-nums", updated.stale ? "text-amber-400" : "text-[var(--text-muted)]")}>
            {updated.stale && "⚠ "}updated {updated.label}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          <div className="space-y-4">
            {[5, 2].map((count, ri) => (
              <div key={ri}>
                <div className="h-2.5 w-24 rounded bg-[var(--bg-card)] animate-pulse mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="h-36 rounded-lg bg-[var(--bg-card)] animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="h-96 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-16 text-center">
          <Globe className="h-8 w-8 text-[var(--text-muted)]/40 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">
            Global market data unavailable —{" "}
            <code className="font-mono text-[10px] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">--indexes --ai</code>{" "}
            to generate
          </p>
        </div>
      )}

      {/* Two-column layout */}
      {data && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">

          {/* Left: index list + synthesis */}
          <div className="space-y-5">
            {REGION_ORDER.map((region) => {
              const entries = byRegion[region];
              if (!entries?.length) return null;
              return (
                <div key={region}>
                  <RegionLabel label={region} />
                  <div className="grid grid-cols-2 gap-2">
                    {entries.map((entry) => (
                      <IndexCard
                        key={entry.ticker}
                        entry={entry}
                        isSelected={selectedTicker === entry.ticker}
                        onClick={() => setSelectedTicker(
                          selectedTicker === entry.ticker ? null : entry.ticker
                        )}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <div>
              <RegionLabel label="Global Synthesis" />
              <GlobalSynthesisCard synthesis={data.global_synthesis} />
            </div>
          </div>

          {/* Right: detail panel — offset to align with first index card row */}
          <div className="lg:sticky lg:top-4">
            {/* Invisible spacer that matches RegionLabel height + mb-2.5 */}
            <div className="flex items-center gap-2 mb-2.5 invisible" aria-hidden>
              <div className="w-[2px] h-3 rounded-full" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">·</span>
            </div>
            {selectedEntry ? (
              <IndexDetail entry={selectedEntry} />
            ) : (
              <EmptyState />
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default function GlobalMarketsPage() {
  return (
    <Suspense>
      <GlobalMarketsContent />
    </Suspense>
  );
}
