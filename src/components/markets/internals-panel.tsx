"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  STAGE_COLORS,
  SECTOR_ETF_NAMES,
  SIGNAL_DESCRIPTIONS,
} from "@/lib/constants";
import { parseCategory, parseSignals } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Zap,
  AlertCircle,
} from "lucide-react";
import { SectorSignalBar } from "@/components/sectors/sector-signal-bar";
import type { ScreenerResult } from "@/lib/types";

/* ─── Constants ──────────────────────────────────────────────── */

const SECTOR_ETFS = Object.keys(SECTOR_ETF_NAMES);

const STAGE_ORDER = ["S", "A", "B", "2", "X", "1", "1D", "0", "3", "4"] as const;

// Heatmap key stages (most meaningful for traders)
const HEATMAP_COLS = ["S", "A", "B", "2", "1", "3", "4"] as const;
type HeatmapCol = (typeof HEATMAP_COLS)[number];

const BULLISH_CATS = new Set(["S", "A", "B", "2"]);
const BEARISH_CATS = new Set(["3", "4"]);

/* ─── Helpers ────────────────────────────────────────────────── */

function computeStageCounts(results: ScreenerResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of results) {
    const cat = parseCategory(r.category);
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

// Normalize verbose signal strings to canonical keys that match SIGNAL_DESCRIPTIONS
function normalizeSignal(sig: string): string | null {
  const s = sig.trim();
  if (!s) return null;
  // Filter orphan / noise signals
  if (/^Touch \d/.test(s)) return null;
  if (/^Corr: /.test(s)) return null;
  if (s.startsWith("[Basis]")) return null;
  // Prefix-based normalization
  if (s.startsWith("RS Line at 52wk High")) return "RS Line at 52wk High";
  if (s.startsWith("Pocket Pivot")) return "Pocket Pivot";
  if (s.startsWith("SMA200 Bounce")) return "SMA200 Bounce";
  if (s.startsWith("Sign of Weakness")) return "Sign of Weakness";
  if (s.startsWith("Inst. Score:")) return "Institutional Score";
  if (s.startsWith("Caution: RSI Overbought")) return "RSI Overbought";
  if (s.startsWith("Breakaway Gap")) return "Breakaway Gap";
  if (s.startsWith("Inside Day Cluster")) return "Inside Day Cluster";
  if (s.startsWith("Churning")) return "Churning";
  if (s.startsWith("Upthrust")) return "Upthrust";
  if (/^\d+ supply bars/.test(s)) return "Supply Bars (20d)";
  if (/^\d+ absorption bars/.test(s)) return "Absorption Bars (20d)";
  if (/^Price\([^)]+\) vs OBV/.test(s)) return null; // too noisy
  return s;
}

function computeSignalCounts(results: ScreenerResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of results) {
    for (const sig of parseSignals(r.signals)) {
      const key = normalizeSignal(sig);
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

// Convert any color format to rgba with given alpha
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // rgba(...) — replace the alpha value
  return color.replace(/[\d.]+\)$/, `${alpha})`);
}

function healthScore(bullish: number, total: number): number {
  return total > 0 ? Math.round((bullish / total) * 100) : 0;
}

function scoreColor(score: number) {
  if (score >= 60) return { text: "text-[var(--long)]", border: "border-[var(--long)]/25", bg: "bg-[var(--long)]/8", label: "Bullish" };
  if (score >= 50) return { text: "text-[var(--long)]", border: "border-[var(--long)]/25", bg: "bg-[var(--long)]/8", label: "Moderately bullish" };
  if (score >= 40) return { text: "text-[var(--caution)]", border: "border-[var(--caution)]/25", bg: "bg-[var(--caution)]/8", label: "Mixed" };
  if (score >= 30) return { text: "text-[var(--severe)]", border: "border-[var(--severe)]/25", bg: "bg-[var(--severe)]/8", label: "Moderately bearish" };
  return { text: "text-[var(--short)]", border: "border-[var(--short)]/25", bg: "bg-[var(--short)]/8", label: "Bearish" };
}

/* ─── Stage Distribution Bar ─────────────────────────────────── */

function StageDistributionBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  const segments = STAGE_ORDER.filter((k) => (counts[k] || 0) > 0);

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-10 rounded-lg overflow-hidden gap-px">
        {segments.map((code) => {
          const count = counts[code] || 0;
          const pct = (count / total) * 100;
          const color = STAGE_COLORS[code]?.color || "#64748b";
          return (
            <div
              key={code}
              className="relative group flex items-center justify-center"
              style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? 2 : 0 }}
              title={`${STAGE_COLORS[code]?.label}: ${count} (${pct.toFixed(1)}%)`}
            >
              {pct >= 5 && (
                <span className="text-xs font-bold text-white/90 drop-shadow tabular-nums select-none">
                  {code}
                </span>
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                <span className="font-semibold" style={{ color }}>{STAGE_COLORS[code]?.label}</span>
                {" "}&mdash; {count} stocks ({pct.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((code) => {
          const count = counts[code] || 0;
          const pct = ((count / total) * 100).toFixed(0);
          const color = STAGE_COLORS[code]?.color || "#64748b";
          return (
            <div key={code} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--text-muted)]">{STAGE_COLORS[code]?.label}</span>
              <span className="text-xs font-bold tabular-nums" style={{ color }}>
                {count}
              </span>
              <span className="text-xs text-[var(--text-muted)]">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Heatmap Cell ───────────────────────────────────────────── */

function HeatCell({ count, max, stageColor }: { count: number; max: number; stageColor: string }) {
  if (count === 0) {
    return (
      <td className="px-2 py-2.5 text-center">
        <span className="text-xs text-[var(--text-muted)]/30">—</span>
      </td>
    );
  }
  const intensity = max > 0 ? count / max : 0;
  const bgAlpha = Math.max(0.12, intensity * 0.65);
  const isStrong = intensity > 0.55;

  return (
    <td className="px-2 py-2.5 text-center">
      <span
        className="inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold tabular-nums"
        style={{
          backgroundColor: withAlpha(stageColor, bgAlpha),
          color: isStrong ? stageColor : "var(--text-primary)",
        }}
      >
        {count}
      </span>
    </td>
  );
}

/* ─── Signal Distribution ────────────────────────────────────── */

function SignalRow({
  name,
  description,
  count,
  max,
}: {
  name: string;
  description: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="grid gap-3 items-center" style={{ gridTemplateColumns: "200px 1fr 40px" }}>
      <div>
        <p className="text-xs font-semibold text-[var(--text-primary)]">{name}</p>
        <p className="text-xs text-[var(--text-muted)] leading-snug mt-0.5">{description}</p>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>
      <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums text-right">
        {count}
      </span>
    </div>
  );
}

/* ─── Metric Card ────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  badge,
  textColor,
  bgColor,
  borderColor,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn("rounded-lg border p-5 flex flex-col gap-2", bgColor, borderColor)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <Icon className={cn("h-4 w-4", textColor)} />
      </div>
      <p className={cn("text-3xl font-bold tabular-nums leading-none", textColor)}>{value}</p>
      {badge && (
        <span
          className={cn(
            "self-start px-2 py-0.5 rounded text-xs font-semibold border",
            bgColor,
            textColor,
            borderColor
          )}
        >
          {badge}
        </span>
      )}
      {sub && <p className="text-xs text-[var(--text-muted)] leading-snug">{sub}</p>}
    </div>
  );
}

/* ─── Loading Pulse ──────────────────────────────────────────── */

function Pulse({ className }: { className?: string }) {
  return <div className={cn("rounded bg-[var(--bg-primary)]", className)} />;
}

/* ─── Page ───────────────────────────────────────────────────── */

export function InternalsPanel() {
  // Fetch all 11 sector ticker lists in parallel
  const sectorQueries = useQueries({
    queries: SECTOR_ETFS.map((etf) => ({
      queryKey: ["sector-tickers", etf],
      queryFn: () => api.sectorTickers(etf),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isAnyLoading = sectorQueries.some((q) => q.isLoading);
  const loadedCount = sectorQueries.filter((q) => q.isFetched).length;

  // Per-sector aggregated data
  const sectorData = useMemo(
    () =>
      SECTOR_ETFS.map((etf, i) => {
        const results = sectorQueries[i].data?.results ?? [];
        return {
          etf,
          name: SECTOR_ETF_NAMES[etf],
          results,
          counts: computeStageCounts(results),
          total: results.length,
          isFetched: sectorQueries[i].isFetched,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectorQueries]
  );

  // Global aggregates
  const allResults = useMemo(
    () => sectorData.flatMap((s) => s.results),
    [sectorData]
  );
  const totalStocks = allResults.length;
  const globalCounts = useMemo(() => computeStageCounts(allResults), [allResults]);
  const signalCounts = useMemo(() => computeSignalCounts(allResults), [allResults]);

  // Health metrics
  const bullishCount = useMemo(
    () => [...BULLISH_CATS].reduce((sum, cat) => sum + (globalCounts[cat] || 0), 0),
    [globalCounts]
  );
  const bearishCount = useMemo(
    () => [...BEARISH_CATS].reduce((sum, cat) => sum + (globalCounts[cat] || 0), 0),
    [globalCounts]
  );
  const score = healthScore(bullishCount, totalStocks);
  const scoreStyle = scoreColor(score);
  const stage2Count = globalCounts["2"] || 0;
  const stage2Pct = totalStocks > 0 ? Math.round((stage2Count / totalStocks) * 100) : 0;
  const bullBearRatio =
    bearishCount > 0 ? (bullishCount / bearishCount).toFixed(1) + "×" : "∞";
  const ratioStyle =
    bullishCount >= bearishCount
      ? { text: "text-[var(--long)]", border: "border-[var(--long)]/25", bg: "bg-[var(--long)]/8" }
      : { text: "text-[var(--short)]", border: "border-[var(--short)]/25", bg: "bg-[var(--short)]/8" };

  // Per-column max for heatmap intensity scaling
  const colMaxes = useMemo(() => {
    const maxes: Record<string, number> = {};
    for (const col of HEATMAP_COLS) {
      maxes[col] = Math.max(...sectorData.map((s) => s.counts[col] || 0), 1);
    }
    return maxes;
  }, [sectorData]);

  // Known signals with count > 0, sorted by count desc
  const knownSignals = Object.entries(SIGNAL_DESCRIPTIONS)
    .map(([key, val]) => ({ key, ...val, count: signalCounts[key] || 0 }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxSignalCount = Math.max(...knownSignals.map((s) => s.count), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Market Internals
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Stage distribution and signal breadth across all sectors
            {totalStocks > 0 && ` · ${totalStocks.toLocaleString()} stocks`}
          </p>
        </div>
        {isAnyLoading && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            {loadedCount}/{SECTOR_ETFS.length} sectors
          </div>
        )}
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {totalStocks === 0 ? (
          <>
            <Pulse className="h-36" />
            <Pulse className="h-36" />
            <Pulse className="h-36" />
          </>
        ) : (
          <>
            <MetricCard
              label="Market Health Score"
              value={`${score}%`}
              badge={scoreStyle.label}
              sub={`${bullishCount} stocks in bullish stages (S · A · B · Stage 2)`}
              textColor={scoreStyle.text}
              bgColor={scoreStyle.bg}
              borderColor={scoreStyle.border}
              icon={Activity}
            />
            <MetricCard
              label="Bull / Bear Ratio"
              value={bullBearRatio}
              badge={bullishCount >= bearishCount ? "Favorable" : "Unfavorable"}
              sub={`${bullishCount} bullish · ${bearishCount} bearish stocks`}
              textColor={ratioStyle.text}
              bgColor={ratioStyle.bg}
              borderColor={ratioStyle.border}
              icon={bullishCount >= bearishCount ? TrendingUp : TrendingDown}
            />
            <MetricCard
              label="Stage 2 Uptrends"
              value={stage2Count.toString()}
              badge={`${stage2Pct}% of universe`}
              sub={`${globalCounts["S"] || 0} Sure Shot · ${globalCounts["A"] || 0} Action`}
              textColor="text-[var(--long)]"
              bgColor="bg-[var(--long)]/8"
              borderColor="border-[var(--long)]/25"
              icon={BarChart3}
            />
          </>
        )}
      </div>

      {/* Stage Distribution Bar */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Universe Stage Distribution
          </h2>
          {totalStocks > 0 && (
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {totalStocks.toLocaleString()} stocks · {SECTOR_ETFS.length} sectors
            </span>
          )}
        </div>
        {totalStocks === 0 ? (
          <div className="space-y-3">
            <Pulse className="h-10 w-full" />
            <div className="flex gap-4">
              {[100, 80, 70, 90, 60].map((w, i) => (
                <Pulse key={i} className={`h-4 w-${w}`} />
              ))}
            </div>
          </div>
        ) : (
          <StageDistributionBar counts={globalCounts} total={totalStocks} />
        )}
      </section>

      {/* Sector Heatmap */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
            Sector Heatmap
          </h2>
          {/* Stage color legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {HEATMAP_COLS.map((col) => (
              <div key={col} className="flex items-center gap-1 text-xs">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: STAGE_COLORS[col]?.color }}
                />
                <span className="text-[var(--text-muted)]">{STAGE_COLORS[col]?.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[var(--bg-primary)]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-[160px]">
                  Sector
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider min-w-[140px]">
                  Stage Mix
                </th>
                {HEATMAP_COLS.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-2.5 text-center text-xs font-bold w-12"
                    style={{ color: STAGE_COLORS[col]?.color }}
                  >
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-14">
                  Total
                </th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {sectorData.map((sector) => (
                <tr
                  key={sector.etf}
                  className="border-t border-[var(--border)] hover:bg-[var(--bg-primary)]/60 transition-colors group"
                >
                  {/* Sector label */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {sector.etf}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                      {sector.name}
                    </p>
                  </td>

                  {/* Signal bar */}
                  <td className="px-4 py-3">
                    {!sector.isFetched ? (
                      <Pulse className="h-2 w-28" />
                    ) : sector.total === 0 ? (
                      <span className="text-xs text-[var(--text-muted)] italic">No data</span>
                    ) : (
                      <div className="w-36">
                        <SectorSignalBar results={sector.results} />
                      </div>
                    )}
                  </td>

                  {/* Stage cells */}
                  {HEATMAP_COLS.map((col) => {
                    if (!sector.isFetched) {
                      return (
                        <td key={col} className="px-2 py-3 text-center">
                          <Pulse className="h-5 w-6 mx-auto" />
                        </td>
                      );
                    }
                    return (
                      <HeatCell
                        key={col}
                        count={sector.counts[col as HeatmapCol] || 0}
                        max={colMaxes[col]}
                        stageColor={STAGE_COLORS[col]?.color || "#64748b"}
                      />
                    );
                  })}

                  {/* Total */}
                  <td className="px-3 py-3 text-right">
                    {!sector.isFetched ? (
                      <Pulse className="h-4 w-8 ml-auto" />
                    ) : (
                      <span className="text-xs font-semibold text-[var(--text-muted)] tabular-nums">
                        {sector.total}
                      </span>
                    )}
                  </td>

                  {/* Link */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/sectors/${sector.etf}`}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals footer row */}
            {totalStocks > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-primary)]">
                  <td
                    className="px-4 py-2.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider"
                    colSpan={2}
                  >
                    All Sectors
                  </td>
                  {HEATMAP_COLS.map((col) => (
                    <td key={col} className="px-2 py-2.5 text-center">
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: STAGE_COLORS[col]?.color }}
                      >
                        {globalCounts[col] || 0}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-[var(--text-primary)] tabular-nums">
                    {totalStocks}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Signal Distribution */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Signal Distribution
          </h2>
          {totalStocks > 0 && (
            <span className="ml-auto text-xs text-[var(--text-muted)]">
              across {totalStocks.toLocaleString()} stocks
            </span>
          )}
        </div>

        {totalStocks === 0 ? (
          <div className="space-y-5">
            {[200, 180, 150, 170, 130].map((w, i) => (
              <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: "200px 1fr 40px" }}>
                <Pulse className="h-8" />
                <Pulse className="h-2" />
                <Pulse className="h-4" />
              </div>
            ))}
          </div>
        ) : knownSignals.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
            <AlertCircle className="h-4 w-4" />
            No recognized signals found in loaded data.
          </div>
        ) : (
          <div className="space-y-5">
            {knownSignals.map((sig) => (
              <SignalRow
                key={sig.key}
                name={sig.name}
                description={sig.description}
                count={sig.count}
                max={maxSignalCount}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
