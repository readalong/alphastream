"use client";

import { useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Shield,
  Play,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  RefreshCw,
  Zap,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegime } from "@/hooks/use-recommendations";
import {
  useStrategyShorts,
  useStrategyHedges,
  useStrategyAllocation,
  useStrategyBR,
  useStrategyIntermarket,
  useRunStrategy,
} from "@/hooks/use-strategy";
import type {
  RegimeColor,
  ShortCandidate,
  HedgeItem,
  BRSignal,
  StrategyMode,
  IntermarketAsset,
} from "@/lib/types";

// ─── Style maps ───────────────────────────────────────────────────────────────

const REGIME_STYLE: Record<
  RegimeColor,
  { bg: string; border: string; dot: string; text: string; label: string }
> = {
  GREEN:  { bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400", text: "text-emerald-400", label: "RISK ON"  },
  YELLOW: { bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400",   text: "text-amber-400",   label: "CAUTION"  },
  RED:    { bg: "bg-red-500/10",     border: "border-red-500/25",     dot: "bg-red-400",     text: "text-red-400",     label: "RISK OFF" },
};

const MODE_STYLE: Record<
  StrategyMode,
  { text: string; bg: string; border: string; label: string }
> = {
  BULL:          { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", label: "BULL"          },
  BULL_VOLATILE: { text: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/30",   label: "BULL VOLATILE" },
  CORRECTION:    { text: "text-orange-400",  bg: "bg-orange-500/15",  border: "border-orange-500/30",  label: "CORRECTION"    },
  BEAR:          { text: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/30",     label: "BEAR"          },
  RECOVERY:      { text: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30",    label: "RECOVERY"      },
};

// Static allocation targets by strategy mode (from trading engine docs)
const ALLOC_TARGETS: Record<StrategyMode, { long: number; short: number; hedge: number; cash: number }> = {
  BULL:          { long: 80, short: 0,  hedge: 0,  cash: 20 },
  BULL_VOLATILE: { long: 60, short: 0,  hedge: 10, cash: 30 },
  CORRECTION:    { long: 40, short: 10, hedge: 15, cash: 35 },
  BEAR:          { long: 10, short: 30, hedge: 25, cash: 35 },
  RECOVERY:      { long: 50, short: 5,  hedge: 10, cash: 35 },
};

const SHORT_STYLE: Record<string, { text: string; bg: string; label: string }> = {
  STRONG_SHORT:      { text: "text-red-300",    bg: "bg-red-500/15",    label: "SS" },
  SHORT:             { text: "text-orange-300", bg: "bg-orange-500/15", label: "SH" },
  SPECULATIVE_SHORT: { text: "text-amber-300",  bg: "bg-amber-500/15",  label: "SP" },
};

const SECTOR_TIER_STYLE: Record<string, { text: string; bg: string }> = {
  LAGGING: { text: "text-red-400",     bg: "bg-red-500/10"     },
  WEAK:    { text: "text-orange-400",  bg: "bg-orange-500/10"  },
  NEUTRAL: { text: "text-slate-400",   bg: "bg-slate-500/10"   },
  STRONG:  { text: "text-emerald-400", bg: "bg-emerald-500/10" },
  LEADING: { text: "text-blue-400",    bg: "bg-blue-500/10"    },
};

const HEDGE_TIER: Record<
  string,
  { icon: LucideIcon; label: string; color: string }
> = {
  FUTURES:     { icon: BarChart2,    label: "Index Futures", color: "text-blue-400"   },
  INVERSE_ETF: { icon: TrendingDown, label: "Inverse ETFs",  color: "text-orange-400" },
  SAFE_HAVEN:  { icon: Shield,       label: "Safe Havens",   color: "text-amber-400"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtPrice(v: number | undefined | null) {
  if (v == null || isNaN(v)) return "—";
  return v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`;
}

/** Returns true when a query errored with a 404 (data not generated yet) */
function isNotFound(q: { isError: boolean; error: unknown }) {
  return q.isError && q.error instanceof Error && q.error.message.includes("404");
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-[var(--border)]", className)} />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
      <Zap className="h-7 w-7 text-[var(--text-muted)]" />
      <p className="text-xs text-[var(--text-muted)] max-w-xs">{message}</p>
    </div>
  );
}

function AllocationBar({
  label,
  current,
  target,
  colorClass,
}: {
  label: string;
  current: number | undefined;
  target: number;
  colorClass: string;
}) {
  const val = current ?? 0;
  // Map text-* to bg-* for the bar fill
  const bgClass = colorClass.replace("text-", "bg-");
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-mono text-xs font-semibold", colorClass)}>
            {val.toFixed(0)}%
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">/ {target}% tgt</span>
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-[var(--border)] overflow-visible">
        <div
          className={cn("h-full rounded-full transition-all duration-500", bgClass)}
          style={{ width: `${Math.min(val, 100)}%` }}
        />
        {/* Target tick */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-sm bg-white/30"
          style={{ left: `${Math.min(target, 100)}%` }}
        />
      </div>
    </div>
  );
}

function IntermarketCard({
  label,
  ticker,
  data,
}: {
  label: string;
  ticker: string;
  data: IntermarketAsset | undefined;
}) {
  if (!data) return null;
  const isOut = data.signal === "OUTPERFORMING"; // safe-haven outperforming = risk-off (bad for equities)
  const isUnder = data.signal === "UNDERPERFORMING"; // safe-haven lagging = risk-on (good for equities)
  const signalColor = isOut ? "text-red-400" : isUnder ? "text-emerald-400" : "text-slate-400";
  const cardCls = isOut
    ? "bg-red-500/8 border-red-500/20"
    : isUnder
    ? "bg-emerald-500/8 border-emerald-500/20"
    : "bg-[var(--bg-card)] border-[var(--border)]";

  return (
    <div className={cn("rounded-lg border p-3 flex-1 min-w-0", cardCls)}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono ml-1.5">{ticker}</span>
        </div>
        <span className={cn("text-[10px] font-bold tracking-wider shrink-0", signalColor)}>
          {data.signal.replace("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] block">20d vs SPY</span>
          <span className={cn("font-mono text-sm font-semibold", data.vs_spy_20d_pct >= 0 ? "text-red-400" : "text-emerald-400")}>
            {fmtPct(data.vs_spy_20d_pct)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-muted)] block">50d vs SPY</span>
          <span className={cn("font-mono text-sm font-semibold", data.vs_spy_50d_pct >= 0 ? "text-red-400" : "text-emerald-400")}>
            {fmtPct(data.vs_spy_50d_pct)}
          </span>
        </div>
      </div>
    </div>
  );
}

function BRRow({ signal }: { signal: BRSignal }) {
  const isShort = signal.signal_type === "BR_SHORT";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        isShort
          ? "bg-amber-500/10 border-amber-500/25"
          : "bg-emerald-500/10 border-emerald-500/25"
      )}
    >
      {isShort ? (
        <ArrowUpRight className="h-4 w-4 text-amber-400 shrink-0" />
      ) : (
        <ArrowDownRight className="h-4 w-4 text-emerald-400 shrink-0" />
      )}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={cn(
            "text-[10px] font-bold tracking-wider shrink-0",
            isShort ? "text-amber-400" : "text-emerald-400"
          )}
        >
          {signal.signal_type.replace("_", " ")}
        </span>
        <Link
          href={`/ticker/${signal.ticker}`}
          className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors shrink-0"
        >
          {signal.ticker}
        </Link>
        {signal.description && (
          <span className="text-xs text-[var(--text-muted)] truncate">{signal.description}</span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {signal.close_price > 0 && (
          <span className="font-mono text-sm text-[var(--text-primary)]">
            {fmtPrice(signal.close_price)}
          </span>
        )}
        <span
          className={cn(
            "text-xs font-semibold",
            signal.rsi > 70
              ? "text-amber-400"
              : signal.rsi < 30
              ? "text-emerald-400"
              : "text-slate-400"
          )}
        >
          RSI {signal.rsi.toFixed(1)}
        </span>
        {signal.urgency === "HIGH" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-medium">
            HIGH
          </span>
        )}
      </div>
    </div>
  );
}

function ShortCard({ c }: { c: ShortCandidate }) {
  const style = SHORT_STYLE[c.conviction?.tier] ?? SHORT_STYLE["SHORT"];
  const signals = c.screener_signals?.split("|").filter(Boolean) ?? [];
  const target1 = c.targets?.[0];

  return (
    <div className="rounded-lg border border-[var(--border)] p-3 hover:border-red-500/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0", style.bg, style.text)}>
            {style.label}
          </span>
          <Link
            href={`/ticker/${c.ticker}`}
            className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            {c.ticker}
          </Link>
          <span className="text-xs text-[var(--text-muted)] truncate">{c.sector}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {c.factor_score?.adjusted_total != null && (
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {c.factor_score.adjusted_total}pts
            </span>
          )}
          <span className="font-mono text-sm text-[var(--text-primary)]">
            {fmtPrice(c.close_price)}
          </span>
        </div>
      </div>

      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {signals.slice(0, 4).map((s) => (
            <span
              key={s}
              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {c.entry_price != null && (
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Entry</span>
            <span className="font-mono text-xs text-[var(--text-primary)]">{fmtPrice(c.entry_price)}</span>
          </div>
        )}
        {target1?.price != null && (
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Target ↓</span>
            <span className="font-mono text-xs text-emerald-400">{fmtPrice(target1.price)}</span>
          </div>
        )}
        {c.stop_loss != null && (
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Stop ↑</span>
            <span className="font-mono text-xs text-red-400">{fmtPrice(c.stop_loss)}</span>
          </div>
        )}
      </div>

      {c.risk_reward_ratio != null && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)]">R/R</span>
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              c.risk_reward_ratio >= 2 ? "text-emerald-400" : "text-amber-400"
            )}
          >
            1:{c.risk_reward_ratio.toFixed(1)}
          </span>
          {c.conviction?.rationale && (
            <span className="text-[10px] text-[var(--text-muted)] truncate ml-auto max-w-[160px]">
              {c.conviction.rationale}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function HedgeTierSection({ tier, items }: { tier: string; items: HedgeItem[] }) {
  if (!items.length) return null;
  const style = HEDGE_TIER[tier] ?? { icon: Package, label: tier, color: "text-slate-400" };
  const Icon = style.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-3.5 w-3.5", style.color)} />
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", style.color)}>
          {style.label}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((h) => (
          <div
            key={h.instrument}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{h.instrument}</span>
                <span className={cn("text-[10px] font-semibold", h.direction === "SHORT" ? "text-red-400" : "text-emerald-400")}>
                  {h.direction}
                </span>
              </div>
              {h.rationale && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-[220px]">
                  {h.rationale}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right ml-3">
              <span className={cn("font-mono text-sm font-semibold", style.color)}>
                {(h.allocation_pct * 100).toFixed(1)}%
              </span>
              {h.notional_value != null && (
                <span className="text-[10px] text-[var(--text-muted)] block">
                  ${h.notional_value.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const [tick, setTick] = useState(0);
  const [shortConvFilter, setShortConvFilter] = useState<Set<string>>(new Set());
  const [shortTierFilter, setShortTierFilter] = useState<Set<string>>(new Set());

  const regime       = useRegime();
  const allocation   = useStrategyAllocation();
  const shorts       = useStrategyShorts();
  const hedges       = useStrategyHedges();
  const br           = useStrategyBR();
  const intermarket  = useStrategyIntermarket();
  const runStrategy  = useRunStrategy();

  const mode      = allocation.data?.mode;
  const modeStyle = mode ? (MODE_STYLE[mode] ?? null) : null;
  const targets   = mode ? (ALLOC_TARGETS[mode] ?? null) : null;

  // Normalize allocation current — backend may use `long` or `long_pct`
  const rawCurrent = allocation.data?.current as Record<string, number> | undefined;
  const current = {
    long_pct:  rawCurrent?.long_pct  ?? rawCurrent?.long  ?? 0,
    short_pct: rawCurrent?.short_pct ?? rawCurrent?.short ?? 0,
    hedge_pct: rawCurrent?.hedge_pct ?? rawCurrent?.hedge ?? 0,
    cash_pct:  rawCurrent?.cash_pct  ?? rawCurrent?.cash  ?? 0,
  };

  const shortList  = shorts.data?.short_recommendations ?? [];

  // Filter counts (from full list — chips always show total available)
  const shortConvCounts = shortList.reduce<Record<string, number>>((acc, c) => {
    const k = c.conviction?.tier ?? "";
    if (k) acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const shortTierCounts = shortList.reduce<Record<string, number>>((acc, c) => {
    const k = c.sector_tier ?? "";
    if (k) acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  // Filtered list
  const filteredShortList = shortList.filter((c) => {
    if (shortConvFilter.size > 0 && !shortConvFilter.has(c.conviction?.tier ?? "")) return false;
    if (shortTierFilter.size > 0 && !shortTierFilter.has(c.sector_tier ?? "")) return false;
    return true;
  });
  const hasShortFilters = shortConvFilter.size > 0 || shortTierFilter.size > 0;

  // Sector grouping on filtered list, preserving API's sector-avg-score order
  const shortSectorOrder = Array.from(new Set(filteredShortList.map((c) => c.sector ?? "Other")));
  const shortBySector = shortSectorOrder.map((sector) => ({
    sector,
    items: filteredShortList.filter((c) => (c.sector ?? "Other") === sector),
  }));

  const hedgeList  = hedges.data?.hedges ?? [];
  const brList     = br.data?.br_signals ?? [];

  const hedgeByTier = {
    FUTURES:     hedgeList.filter((h) => h.instrument_type === "futures"),
    INVERSE_ETF: hedgeList.filter((h) => h.instrument_type === "inverse_etf"),
    SAFE_HAVEN:  hedgeList.filter((h) => h.instrument_type === "safe_haven"),
  };

  const totalHedgePct = hedgeList.reduce((sum, h) => sum + h.allocation_pct, 0) * 100;

  const regS = regime.data ? REGIME_STYLE[regime.data.regime] : null;

  const anyNotRun =
    isNotFound(allocation) || isNotFound(shorts) || isNotFound(hedges);

  const handleRun = () => {
    runStrategy.mutate();
    setTick((n) => n + 1);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">All-Weather Strategy</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Unified daily action list — long · short · hedge · exit
          </p>
        </div>
        <div className="flex items-center gap-2">
          {modeStyle && (
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full border",
                modeStyle.bg,
                modeStyle.border,
                modeStyle.text
              )}
            >
              {modeStyle.label}
            </span>
          )}
          <button
            onClick={handleRun}
            disabled={runStrategy.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--accent)] text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {runStrategy.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {runStrategy.isPending ? "Running…" : "Run Strategy"}
          </button>
          <button
            onClick={() => setTick((n) => n + 1)}
            title="Refresh"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Strategy-not-run notice ────────────────────────────────────────── */}
      {anyNotRun && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-medium">Strategy not generated today</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Click <strong className="text-[var(--text-primary)]">Run Strategy</strong> to compute
              buy · short · hedge · exit actions. Runs synchronously — takes 60–120 seconds.
            </p>
          </div>
        </div>
      )}

      {/* ── Run feedback ──────────────────────────────────────────────────── */}
      {runStrategy.isSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 shrink-0" />
          Strategy generated successfully — all sections refreshed.
        </div>
      )}
      {runStrategy.isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {runStrategy.error instanceof Error
            ? runStrategy.error.message
            : "Strategy run failed — check backend logs."}
        </div>
      )}

      {/* ── Regime + Allocation ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Regime */}
        <div
          className={cn(
            "rounded-lg border p-4",
            regS ? `${regS.bg} ${regS.border}` : "bg-[var(--bg-card)] border-[var(--border)]"
          )}
        >
          {regime.isPending && (
            <div className="space-y-2">
              <Skel className="h-5 w-48" />
              <Skel className="h-3 w-full" />
            </div>
          )}
          {regime.data && regS && (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={cn("h-2 w-2 rounded-full animate-pulse shrink-0", regS.dot)} />
                <span className={cn("text-sm font-bold tracking-widest", regS.text)}>
                  {regime.data.regime} — {regS.label}
                </span>
                {regime.data.regime_changed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-medium">
                    REGIME CHANGE
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">{regime.data.details}</p>
              {regime.data.transition_action && (
                <p className="mt-2 text-xs text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {regime.data.transition_action}
                </p>
              )}
              {regime.data.breadth && (
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
                  {[
                    { label: "Above 200d", v: `${regime.data.breadth.pct_above_200sma.toFixed(1)}%` },
                    { label: "Above 50d",  v: `${regime.data.breadth.pct_above_50sma.toFixed(1)}%`  },
                    { label: "A/D Ratio",  v: regime.data.breadth.advance_decline_ratio.toFixed(2)   },
                    { label: "20d Highs",  v: String(regime.data.breadth.new_20d_highs)              },
                    { label: "20d Lows",   v: String(regime.data.breadth.new_20d_lows)               },
                    { label: "H/L Ratio",  v: regime.data.breadth.highs_lows_ratio.toFixed(1)        },
                  ].map((i) => (
                    <div key={i.label}>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                        {i.label}
                      </span>
                      <span className="font-mono text-xs text-[var(--text-primary)]">{i.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Allocation gauges */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Portfolio Allocation
          </p>
          {allocation.isPending && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => <Skel key={i} className="h-5 w-full" />)}
            </div>
          )}
          {(allocation.data || targets) && (
            <div className="space-y-4">
              <AllocationBar
                label="Long"
                current={current.long_pct}
                target={targets?.long ?? 0}
                colorClass="text-emerald-400"
              />
              <AllocationBar
                label="Short"
                current={current.short_pct}
                target={targets?.short ?? 0}
                colorClass="text-red-400"
              />
              <AllocationBar
                label="Hedge"
                current={current.hedge_pct}
                target={targets?.hedge ?? 0}
                colorClass="text-amber-400"
              />
              <AllocationBar
                label="Cash"
                current={current.cash_pct}
                target={targets?.cash ?? 0}
                colorClass="text-slate-400"
              />
            </div>
          )}
          {isNotFound(allocation) && !allocation.isPending && (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">
              Run strategy to see allocation
            </p>
          )}
        </div>
      </div>

      {/* ── Intermarket Signals ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            Intermarket Signals
            <span className="ml-1.5 text-[var(--text-muted)]/60 normal-case tracking-normal">
              (always live)
            </span>
          </p>
          {intermarket.data && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                intermarket.data.risk_signal === "RISK_ON"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : intermarket.data.risk_signal === "RISK_OFF"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-slate-500/15 text-slate-400"
              )}
            >
              {intermarket.data.risk_signal.replace("_", "-")}
            </span>
          )}
        </div>

        {intermarket.isPending && (
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => <Skel key={i} className="h-20 flex-1" />)}
          </div>
        )}
        {intermarket.isError && (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">
            Intermarket data unavailable
          </p>
        )}
        {intermarket.data && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <IntermarketCard label="Gold"       ticker="GLD" data={intermarket.data.gld} />
              <IntermarketCard label="Long Bonds" ticker="TLT" data={intermarket.data.tlt} />
              <IntermarketCard label="US Dollar"  ticker="UUP" data={intermarket.data.uup} />
            </div>
            {intermarket.data.commentary && (
              <p className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border)] leading-relaxed">
                {intermarket.data.commentary}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── BR Signals ────────────────────────────────────────────────────── */}
      {(brList.length > 0 || br.isPending || (br.data && brList.length === 0)) && (
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Blow-off / Capitulation Signals (Bollinger-RSI)
          </p>
          {br.isPending && <Skel className="h-10 w-full" />}
          {brList.length > 0 && (
            <div className="space-y-2">
              {brList.map((s, i) => (
                <BRRow key={`${s.ticker}-${i}`} signal={s} />
              ))}
            </div>
          )}
          {br.data && brList.length === 0 && (
            <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]">
              No Bollinger-RSI extreme signals detected today
            </div>
          )}
        </div>
      )}

      {/* ── Short Candidates ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Short Candidates</span>
          </div>
          <div className="flex items-center gap-3">
            {shorts.data?.regime && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                shorts.data.regime === "RED"    ? "bg-red-500/15 text-red-400" :
                shorts.data.regime === "YELLOW" ? "bg-amber-500/15 text-amber-400" :
                                                   "bg-emerald-500/15 text-emerald-400"
              )}>
                {shorts.data.regime}
              </span>
            )}
            {shortList.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {shortList.length} stocks · {Object.keys(shortTierCounts).length > 0 ? Object.keys(shortConvCounts).length + " tiers" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Filter bar — only when data is present */}
        {shortList.length > 0 && (
          <div className="mb-3 pb-3 border-b border-[var(--border)] space-y-2">

            {/* Conviction filter */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] w-[68px] shrink-0 pt-0.5">
                Conviction
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["STRONG_SHORT", "SHORT", "SPECULATIVE_SHORT"] as const)
                  .filter((t) => (shortConvCounts[t] ?? 0) > 0)
                  .map((tier) => {
                    const s = SHORT_STYLE[tier];
                    const active = shortConvFilter.has(tier);
                    const label = tier === "STRONG_SHORT" ? "Strong Short" : tier === "SHORT" ? "Short" : "Speculative";
                    return (
                      <button
                        key={tier}
                        onClick={() => {
                          const next = new Set(shortConvFilter);
                          active ? next.delete(tier) : next.add(tier);
                          setShortConvFilter(next);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded border transition-all duration-150",
                          active
                            ? cn(s.bg, s.text, "border-current/30")
                            : "bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]/60 hover:text-[var(--text-primary)]"
                        )}
                      >
                        {label}
                        <span className={cn("font-mono text-[9px]", active ? "opacity-70" : "opacity-40")}>
                          {shortConvCounts[tier]}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Sector tier filter */}
            {Object.keys(shortTierCounts).length > 0 && (
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] w-[68px] shrink-0 pt-0.5">
                  Sector
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(["LAGGING", "WEAK", "NEUTRAL", "STRONG", "LEADING"] as const)
                    .filter((t) => (shortTierCounts[t] ?? 0) > 0)
                    .map((tier) => {
                      const s = SECTOR_TIER_STYLE[tier];
                      const active = shortTierFilter.has(tier);
                      const label = tier.charAt(0) + tier.slice(1).toLowerCase();
                      return (
                        <button
                          key={tier}
                          onClick={() => {
                            const next = new Set(shortTierFilter);
                            active ? next.delete(tier) : next.add(tier);
                            setShortTierFilter(next);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded border transition-all duration-150",
                            active
                              ? cn(s.bg, s.text, "border-current/30")
                              : "bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]/60 hover:text-[var(--text-primary)]"
                          )}
                        >
                          {label}
                          <span className={cn("font-mono text-[9px]", active ? "opacity-70" : "opacity-40")}>
                            {shortTierCounts[tier]}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Active filter summary row */}
            {hasShortFilters && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-[var(--text-muted)]">
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">{filteredShortList.length}</span>
                  {" of "}{shortList.length} showing
                </span>
                <button
                  onClick={() => { setShortConvFilter(new Set()); setShortTierFilter(new Set()); }}
                  className="text-[10px] font-medium text-[var(--accent)] hover:opacity-75 transition-opacity"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* States */}
        {shorts.isPending && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skel key={i} className="h-24 w-full" />)}
          </div>
        )}
        {isNotFound(shorts) && (
          <EmptyState message="Run strategy to generate short candidates" />
        )}
        {shorts.data && shortList.length === 0 && (
          <EmptyState message="No short candidates — market conditions don't warrant short exposure" />
        )}

        {/* No-match state */}
        {shortList.length > 0 && filteredShortList.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 py-10">
            <p className="text-xs text-[var(--text-muted)]">No candidates match the active filters.</p>
            <button
              onClick={() => { setShortConvFilter(new Set()); setShortTierFilter(new Set()); }}
              className="text-xs font-medium text-[var(--accent)] hover:opacity-75 transition-opacity"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Sector-grouped list */}
        {filteredShortList.length > 0 && (
          <div className="max-h-[600px] overflow-y-auto space-y-5 pr-1">
            {shortBySector.map(({ sector, items }) => {
              const tierStyle = items[0]?.sector_tier ? SECTOR_TIER_STYLE[items[0].sector_tier] : null;
              return (
                <div key={sector}>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[var(--bg-card)] py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {sector}
                    </span>
                    {items[0]?.sector_tier && tierStyle && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", tierStyle.bg, tierStyle.text)}>
                        {items[0].sector_tier}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[var(--text-muted)]/60 ml-auto">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((c) => <ShortCard key={c.ticker} c={c} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Hedge Recommendations ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Hedge Recommendations</span>
            </div>
            {hedgeList.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {totalHedgePct.toFixed(1)}% total
              </span>
            )}
          </div>

          {hedges.isPending && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skel key={i} className="h-16 w-full" />)}
            </div>
          )}
          {isNotFound(hedges) && (
            <EmptyState message="Run strategy to generate hedge recommendations" />
          )}
          {hedges.data && hedgeList.length === 0 && (
            <EmptyState message="No hedges recommended — BULL regime favors full long exposure" />
          )}
          {hedgeList.length > 0 && (
            <div className="space-y-5">
              {(["FUTURES", "INVERSE_ETF", "SAFE_HAVEN"] as const).map((tier) =>
                hedgeByTier[tier].length > 0 ? (
                  <HedgeTierSection key={tier} tier={tier} items={hedgeByTier[tier]} />
                ) : null
              )}
            </div>
          )}
      </div>
    </div>
  );
}
