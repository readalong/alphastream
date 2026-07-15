"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  useRegime,
  useSectorRankings,
  usePortfolioHealth,
  useOpenPositions,
  usePendingBreakouts,
  useRecommendations,
  useRecommendationHistory,
  useRunRecommend,
  useAddPosition,
  useClosePosition,
} from "@/hooks/use-recommendations";
import { cn } from "@/lib/utils";
import {
  Play,
  Loader2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Zap,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  X,
  Plus,
  History,
  RefreshCw,
  CircleDot,
} from "lucide-react";
import type {
  RegimeColor,
  ConvictionTier,
  ExitAction,
  SectorTier,
  BuyRecommendation,
  ExitSignal,
  PendingBreakout,
  SectorRanking,
  DailyRecommendations,
  RecommendationHistoryEntry,
  OpenPosition,
  AddPositionRequest,
} from "@/lib/types";

// ─── Style maps ──────────────────────────────────────────────────────────────

const REGIME_STYLE: Record<RegimeColor, { bg: string; border: string; dot: string; text: string; label: string; rowBg: string }> = {
  GREEN:  { bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400", text: "text-emerald-400", label: "RISK ON",  rowBg: "bg-emerald-500/10" },
  YELLOW: { bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400",   text: "text-amber-400",   label: "CAUTION",  rowBg: "bg-amber-500/10"   },
  RED:    { bg: "bg-red-500/10",     border: "border-red-500/25",     dot: "bg-red-400",     text: "text-red-400",     label: "RISK OFF", rowBg: "bg-red-500/10"     },
};

const CONVICTION_STYLE: Record<ConvictionTier, { bg: string; text: string; border: string; leftBorder: string }> = {
  STRONG_BUY:  { bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/30",  leftBorder: "border-l-4 border-l-amber-400"  },
  BUY:         { bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/30",  leftBorder: "border-l-2 border-l-emerald-500" },
  SPECULATIVE: { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/30",   leftBorder: "border-l-2 border-l-blue-500"   },
};

const EXIT_STYLE: Record<ExitAction, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  SELL:    { bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/30",    icon: AlertTriangle },
  REDUCE:  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", icon: TrendingDown  },
  TIGHTEN: { bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30",  icon: ShieldAlert   },
  WARNING: { bg: "bg-slate-500/15",  text: "text-slate-400",  border: "border-slate-500/30",  icon: Clock         },
};

const TIER_STYLE: Record<SectorTier, string> = {
  LEADING: "text-emerald-400",
  NEUTRAL: "text-slate-400",
  LAGGING: "text-red-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(yyyymmdd: string) {
  // "20260322" → "Mar 22"
  const y = yyyymmdd.slice(0, 4);
  const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const d = yyyymmdd.slice(6, 8);
  return new Date(Number(y), m, Number(d)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RegimeBanner({ regime }: { regime: ReturnType<typeof useRegime>["data"] }) {
  const [open, setOpen] = useState(false);
  if (!regime) return null;
  const s = REGIME_STYLE[regime.regime];
  return (
    <div className={cn("rounded-lg border p-4", s.bg, s.border)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn("h-2 w-2 rounded-full animate-pulse", s.dot)} />
          <span className={cn("text-sm font-bold tracking-widest", s.text)}>
            {regime.regime} — {s.label}
          </span>
          {regime.regime_changed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-medium">REGIME CHANGE</span>
          )}
          {Object.entries(regime.index_status).map(([t, s2]) => (
            <span key={t} className="flex items-center gap-1 text-xs">
              <span className="font-mono text-[var(--text-muted)] uppercase">{t}</span>
              <span className={cn("h-1.5 w-1.5 rounded-full", s2.above_20d ? "bg-emerald-400" : "bg-red-400")} />
              <span className={cn("h-1.5 w-1.5 rounded-full", s2.above_50d ? "bg-emerald-400" : "bg-red-400")} />
              <span className={cn("h-1.5 w-1.5 rounded-full", s2.above_200d ? "bg-emerald-400" : "bg-red-400")} />
            </span>
          ))}
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-2">
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      <p className="text-sm text-[var(--text-muted)] mt-1">{regime.details}</p>
      {regime.transition_action && (
        <div className="mt-2 text-sm text-amber-300 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {regime.transition_action}
        </div>
      )}
      {open && regime.breadth && (
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: "Above 200d", value: `${regime.breadth.pct_above_200sma.toFixed(1)}%` },
            { label: "Above 50d",  value: `${regime.breadth.pct_above_50sma.toFixed(1)}%`  },
            { label: "A/D Ratio",  value: regime.breadth.advance_decline_ratio.toFixed(2)   },
            { label: "New 20d H",  value: regime.breadth.new_20d_highs                      },
            { label: "New 20d L",  value: regime.breadth.new_20d_lows                       },
            { label: "H/L Ratio",  value: regime.breadth.highs_lows_ratio.toFixed(1)        },
          ].map(i => (
            <div key={i.label}>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">{i.label}</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">{i.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioHealthBar({ health }: { health: ReturnType<typeof usePortfolioHealth>["data"] }) {
  if (!health) return null;
  const max = health.capacity?.max_heat_pct ?? 10;
  const pct = (health.total_heat_pct / max) * 100;
  const barColor = pct > 80 ? "bg-red-500" : pct > 55 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Heat</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-24 h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="font-mono text-sm text-[var(--text-primary)]">{health.total_heat_pct.toFixed(1)}%</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Positions</span>
          <span className="font-mono text-sm text-[var(--text-primary)]">
            {health.total_positions}
            {health.capacity && <span className="text-[var(--text-muted)]"> / {health.capacity.max_positions}</span>}
          </span>
        </div>
        {health.capacity && (
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Slots</span>
            <span className="font-mono text-sm text-emerald-400">{health.capacity.positions_remaining} left</span>
          </div>
        )}
        {Object.keys(health.sector_breakdown ?? {}).length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {Object.entries(health.sector_breakdown).map(([sec, cnt]) => (
              <span key={sec} className="text-[11px] px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                {sec} ×{cnt}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History feed panel ───────────────────────────────────────────────────────

function HistoryRow({
  entry,
  selected,
  isToday,
  onClick,
}: {
  entry: RecommendationHistoryEntry;
  selected: boolean;
  isToday: boolean;
  onClick: () => void;
}) {
  const s = REGIME_STYLE[entry.regime];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg border transition-all",
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {isToday ? (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 inline" />
                Today
              </span>
            ) : (
              entry.date_iso
                ? new Date(entry.date_iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : fmtDate(entry.date)
            )}
          </span>
        </div>
        <span className={cn("text-[10px] font-bold tracking-wider", s.text)}>{entry.regime}</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        {entry.buy_count > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <TrendingUp className="h-3 w-3" />{entry.buy_count}
          </span>
        )}
        {entry.sell_count > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-red-400">
            <TrendingDown className="h-3 w-3" />{entry.sell_count}
          </span>
        )}
        {entry.pending_count > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-amber-400">
            <Clock className="h-3 w-3" />{entry.pending_count}
          </span>
        )}
        {entry.buy_count === 0 && entry.sell_count === 0 && entry.pending_count === 0 && (
          <span className="text-[11px] text-[var(--text-muted)]">No signals</span>
        )}
      </div>
    </button>
  );
}

// ─── Open positions table ─────────────────────────────────────────────────────

function OpenPositionsTable({
  positions,
  onClose,
  isClosing,
}: {
  positions: OpenPosition[];
  onClose: (ticker: string) => void;
  isClosing: string | null;
}) {
  if (positions.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-emerald-400" />
          Open Positions ({positions.length})
        </h3>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {positions.map(pos => {
          const tier = pos.conviction_tier as ConvictionTier;
          const cs = CONVICTION_STYLE[tier] ?? CONVICTION_STYLE.SPECULATIVE;
          return (
            <div key={pos.ticker} className="flex items-center gap-3 px-4 py-2.5">
              <Link
                href={`/ticker/${pos.ticker}`}
                className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)] w-14 shrink-0"
              >
                {pos.ticker}
              </Link>
              <div className="flex-1 min-w-0 hidden sm:block">
                <span className="text-xs text-[var(--text-muted)]">Entry </span>
                <span className="font-mono text-xs text-[var(--text-primary)]">${pos.entry_price.toFixed(2)}</span>
              </div>
              <div className="flex-1 min-w-0 hidden md:block">
                <span className="text-xs text-[var(--text-muted)]">Stop </span>
                <span className="font-mono text-xs text-red-400">${pos.stop_loss.toFixed(2)}</span>
              </div>
              <div className="flex-1 min-w-0 hidden lg:block">
                <span className="text-xs text-[var(--text-muted)]">Risk </span>
                <span className="font-mono text-xs text-[var(--text-primary)]">{(pos.risk_pct * 100).toFixed(2)}%</span>
              </div>
              <span className={cn("hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0", cs.bg, cs.text, cs.border)}>
                {tier?.replace(/_/g, " ")}
              </span>
              <span className="hidden lg:block text-xs text-purple-400 truncate max-w-[120px] shrink-0">{pos.wave_position}</span>
              <button
                onClick={() => onClose(pos.ticker)}
                disabled={isClosing === pos.ticker}
                className="ml-auto shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-40"
              >
                {isClosing === pos.ticker ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                Close
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Factor score bar ─────────────────────────────────────────────────────────

function FactorBar({ score }: { score: BuyRecommendation["factor_score"] }) {
  const cats = [
    { key: "trend",      label: "Trend", value: score.trend,      color: "bg-blue-500"    },
    { key: "momentum",   label: "Mom",   value: score.momentum,   color: "bg-purple-500"  },
    { key: "volume",     label: "Vol",   value: score.volume,     color: "bg-emerald-500" },
    { key: "volatility", label: "Vty",   value: score.volatility, color: "bg-amber-500"   },
    { key: "wave",       label: "Wave",  value: score.wave,       color: "bg-pink-500"    },
  ] as const;
  return (
    <div className="mt-2">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {cats.map(c => (
          <div key={c.key} className={cn("h-full", c.color)} style={{ width: `${c.value}%` }} title={`${c.label}: ${c.value}/20`} />
        ))}
      </div>
      <div className="flex gap-3 mt-1">
        {cats.map(c => (
          <span key={c.key} className="text-[10px] text-[var(--text-muted)]">
            {c.label} <span className="text-[var(--text-primary)] font-mono">{c.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Buy card ─────────────────────────────────────────────────────────────────

function BuyCard({
  rec,
  openTickers,
  onAdd,
  isAdding,
}: {
  rec: BuyRecommendation;
  openTickers: Set<string>;
  onAdd: (rec: BuyRecommendation) => void;
  isAdding: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const tier = rec.conviction.tier;
  const cs = tier ? CONVICTION_STYLE[tier] : CONVICTION_STYLE.SPECULATIVE;
  const r1 = rec.risk.targets[0];
  const r2 = rec.risk.targets[1];
  const alreadyOpen = openTickers.has(rec.ticker);

  return (
    <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden", cs.leftBorder)}>
      <button
        className="w-full p-4 text-left hover:bg-[var(--bg-page)] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          <span className="text-[var(--text-muted)] text-xs font-mono w-4 shrink-0 mt-0.5">#{rec.rank}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/ticker/${rec.ticker}`}
                onClick={e => e.stopPropagation()}
                className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              >
                {rec.ticker}
              </Link>
              {tier && (
                <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold border", cs.bg, cs.text, cs.border)}>
                  {tier.replace(/_/g, " ")}
                </span>
              )}
              <span className="text-[var(--text-muted)] text-sm">Score</span>
              <span className={cn("font-mono font-bold text-sm", cs.text)}>{rec.factor_score.adjusted_total}</span>
              {rec.weekly_aligned && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">W✓</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-[var(--text-muted)]">
              <span>{rec.sector}</span>
              <span>·</span>
              <span className={TIER_STYLE[rec.sector_tier as SectorTier] ?? "text-slate-400"}>
                {rec.sector_tier} #{rec.sector_rank}
              </span>
              {rec.wave_position && <><span>·</span><span className="text-purple-400">{rec.wave_position}</span></>}
            </div>
            {/* Sector context summary line */}
            {rec.sector_context?.summary && (
              <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">{rec.sector_context.summary}</p>
            )}
            <FactorBar score={rec.factor_score} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              <span className="text-[var(--text-muted)]">
                Entry <span className="font-mono text-[var(--text-primary)]">${rec.entry.trigger_price.toFixed(2)}</span>
                <span className="ml-1 text-[10px]">({rec.entry.trigger_type})</span>
                {rec.entry.volume_confirmed && <CheckCircle2 className="inline h-3 w-3 text-emerald-400 ml-1" />}
              </span>
              <span className="text-[var(--text-muted)]">
                Stop <span className="font-mono text-red-400">${rec.risk.stop_loss.toFixed(2)}</span>
              </span>
              {r1 && (
                <span className="text-[var(--text-muted)]">
                  R1 <span className="font-mono text-emerald-400">${r1.price.toFixed(2)}</span>
                  <span className="text-[10px] ml-0.5">+{r1.pct_gain.toFixed(1)}%</span>
                </span>
              )}
              <span className="text-[var(--text-muted)]">
                R/R <span className="font-mono text-[var(--text-primary)]">{rec.risk.risk_reward_ratio.toFixed(1)}×</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">${rec.close_price.toFixed(2)}</span>
            <ChevronDown className={cn("h-4 w-4 text-[var(--text-muted)] transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
      </button>

      {/* Add position button */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--text-muted)]">
          {rec.entry.confirmation_days}d · {rec.entry.level_significance}
          {rec.entry.guard_warnings.length > 0 && (
            <span className="ml-2 text-amber-400">⚠ {rec.entry.guard_warnings[0]}</span>
          )}
        </span>
        {alreadyOpen ? (
          <span className="text-[11px] px-2 py-1 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="inline h-3 w-3 mr-1" />In portfolio
          </span>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onAdd(rec); }}
            disabled={isAdding === rec.ticker}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 border border-[var(--accent)]/20 transition-colors disabled:opacity-40"
          >
            {isAdding === rec.ticker ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add position
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)] space-y-3">
          {rec.screener_signals && (
            <div className="pt-3">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Signals</span>
              <div className="flex flex-wrap gap-1">
                {rec.screener_signals.split("|").map(s => (
                  <span key={s} className="px-2 py-0.5 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Rationale</span>
            <p className="text-xs text-[var(--text-primary)]">{rec.conviction.rationale}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)]">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Position %</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">{(rec.risk.position_pct * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Position $</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">${rec.risk.position_value.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Shares</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">{rec.risk.shares}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">ATR(14)</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">{rec.risk.atr_14.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Trailing Stop</span>
              <span className="font-mono text-sm text-amber-400">${rec.risk.trailing_stop.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Wave Conf.</span>
              <span className="font-mono text-sm text-purple-400">{rec.wave_confidence}%</span>
            </div>
            {r2 && (
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Target R2</span>
                <span className="font-mono text-sm text-emerald-400">${r2.price.toFixed(2)} (+{r2.pct_gain.toFixed(1)}%)</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Industry</span>
              <span className="text-xs text-[var(--text-primary)]">{rec.industry}</span>
            </div>
          </div>
          {rec.sector_context && (
            <div className="pt-2 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
              {rec.sector_context.etf_200d_extension_pct !== undefined && (
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">200d Ext</span>
                  <span className={cn("font-mono text-sm", rec.sector_context.etf_200d_extension_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {rec.sector_context.etf_200d_extension_pct >= 0 ? "+" : ""}{rec.sector_context.etf_200d_extension_pct.toFixed(1)}%
                  </span>
                </div>
              )}
              {rec.sector_context.etf_vs_spy_20d_pct !== undefined && (
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">vs SPY 20d</span>
                  <span className={cn("font-mono text-sm", rec.sector_context.etf_vs_spy_20d_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {rec.sector_context.etf_vs_spy_20d_pct >= 0 ? "+" : ""}{rec.sector_context.etf_vs_spy_20d_pct.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Exit signal row ──────────────────────────────────────────────────────────

function ExitRow({
  signal,
  onClose,
  isClosing,
}: {
  signal: ExitSignal;
  onClose: (ticker: string, reason: string) => void;
  isClosing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = EXIT_STYLE[signal.action];
  const Icon = s.icon;
  return (
    <div className={cn("rounded-lg border p-3", s.bg, s.border)}>
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center gap-2 text-left" onClick={() => setExpanded(v => !v)}>
          <Icon className={cn("h-3.5 w-3.5 shrink-0", s.text)} />
          <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded border", s.bg, s.text, s.border)}>
            {signal.action}
          </span>
          <Link
            href={`/ticker/${signal.ticker}`}
            onClick={e => e.stopPropagation()}
            className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)]"
          >
            {signal.ticker}
          </Link>
          <span className="text-xs text-[var(--text-muted)] flex-1 truncate">{signal.reason}</span>
          {signal.urgency === "IMMEDIATE" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">IMMEDIATE</span>
          )}
        </button>
        <button
          onClick={() => onClose(signal.ticker, signal.action.toLowerCase())}
          disabled={isClosing === signal.ticker}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-40"
        >
          {isClosing === signal.ticker ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Close
        </button>
        <ChevronDown className={cn("h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 transition-transform cursor-pointer", expanded && "rotate-180")} onClick={() => setExpanded(v => !v)} />
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
          <p className="text-xs text-[var(--text-muted)]">{signal.details}</p>
          {signal.updated_stop != null && (
            <p className="text-xs text-amber-400">Updated stop → <span className="font-mono">${signal.updated_stop.toFixed(2)}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pending breakout card ────────────────────────────────────────────────────

function PendingCard({ b }: { b: PendingBreakout }) {
  const confirmed = b.closes_in_direction >= b.days_required;
  const progress = b.days_required > 0 ? (b.closes_in_direction / b.days_required) * 100 : 100;
  return (
    <div className={cn("rounded-lg border p-3", confirmed ? "border-emerald-500/30 bg-emerald-500/5" : "border-[var(--border)] bg-[var(--bg-card)]")}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {b.direction === "UP"
            ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
          <Link href={`/ticker/${b.ticker}`} className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">
            {b.ticker}
          </Link>
          {confirmed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">CONFIRMED</span>
          )}
        </div>
        <span className="font-mono text-xs text-[var(--text-muted)]">${b.breakout_level.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div className={cn("h-full rounded-full", confirmed ? "bg-emerald-500" : "bg-[var(--accent)]")} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">{b.closes_in_direction}/{b.days_required}d</span>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">q:{b.quality_score.toFixed(2)}</span>
      </div>
      <div className="text-[10px] text-[var(--text-muted)] mt-1">{b.trigger_type} · {b.level_significance}</div>
    </div>
  );
}

// ─── Sector ranking row ───────────────────────────────────────────────────────

function SectorRow({ s, max }: { s: SectorRanking; max: number }) {
  const w = (s.composite_score / max) * 100;
  const barColor = s.tier === "LEADING" ? "bg-emerald-500" : s.tier === "NEUTRAL" ? "bg-slate-500" : "bg-red-500";
  const dir = (s.rotation_accel ?? 0) > 0.2 ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : (s.rotation_accel ?? 0) < -0.2 ? <TrendingDown className="h-3 w-3 text-red-400" /> : null;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] text-[var(--text-muted)] w-4 text-right shrink-0">{s.rank}</span>
      <span className="text-xs font-mono font-semibold text-[var(--text-primary)] w-7 shrink-0">{s.etf}</span>
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[10px] text-[var(--text-muted)] truncate">{s.name}</span>
          {dir}
        </div>
        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${w}%` }} />
        </div>
      </div>
      <span className={cn("text-[10px] font-medium w-8 text-right shrink-0", TIER_STYLE[s.tier])}>
        {s.composite_score.toFixed(0)}
      </span>
    </div>
  );
}

// ─── No data state ────────────────────────────────────────────────────────────

function NoDataState({ isToday, onRun, isRunning }: { isToday: boolean; onRun: () => void; isRunning: boolean }) {
  if (!isToday) return (
    <div className="text-center py-12">
      <Target className="h-8 w-8 text-[var(--text-muted)]/30 mx-auto mb-3" />
      <p className="text-sm text-[var(--text-muted)]">No data for this date.</p>
    </div>
  );
  return (
    <div className="text-center py-12">
      <Target className="h-8 w-8 text-[var(--text-muted)]/30 mx-auto mb-3" />
      <p className="font-medium text-[var(--text-primary)] mb-1">No recommendations yet today</p>
      <p className="text-sm text-[var(--text-muted)] mb-5">Run after today's download completes (typically after 6 PM ET).</p>
      <button
        onClick={onRun}
        disabled={isRunning}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {isRunning ? "Running engine…" : "Run Today's Recommendations"}
      </button>
    </div>
  );
}

// ─── Day detail panel ─────────────────────────────────────────────────────────

function DayDetail({
  date,
  isToday,
  openTickers,
  onAdd,
  onClose,
  addingTicker,
  closingTicker,
  onRun,
  isRunning,
}: {
  date: string;
  isToday: boolean;
  openTickers: Set<string>;
  onAdd: (rec: BuyRecommendation) => void;
  onClose: (ticker: string, reason: string) => void;
  addingTicker: string | null;
  closingTicker: string | null;
  onRun: () => void;
  isRunning: boolean;
}) {
  const recs = useRecommendations(isToday ? undefined : date);
  const pending = usePendingBreakouts(!isToday ? false : true);
  const sectors = useSectorRankings();

  const data: DailyRecommendations | undefined = recs.data;
  const is404 = !recs.isLoading && !data && recs.error instanceof Error && recs.error.message.includes("404");

  const allRankings = data?.sector_rankings?.length ? data.sector_rankings : (sectors.data?.sectors ?? sectors.data?.rankings ?? []);
  const maxScore = allRankings.length ? Math.max(...allRankings.map(r => r.composite_score), 1) : 100;
  const allPending = data?.pending_breakouts?.length ? data.pending_breakouts : pending.data?.pending ?? [];

  if (recs.isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg bg-[var(--bg-card)] animate-pulse" />)}
    </div>
  );

  if (is404) return <NoDataState isToday={isToday} onRun={onRun} isRunning={isRunning} />;

  if (!data) return (
    !isToday && recs.error ? (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--text-muted)]">Failed to load data.</p>
      </div>
    ) : null
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Buys",     value: data.buy_recommendations?.length ?? 0,  color: "text-green-400",   icon: TrendingUp  },
          { label: "Exits",    value: data.sell_signals?.length ?? 0,          color: "text-red-400",     icon: TrendingDown },
          { label: "Pending",  value: data.pending_breakouts?.length ?? 0,     color: "text-amber-400",   icon: Clock        },
          { label: "Screened", value: data.summary?.candidates_screened ?? 0,  color: "text-[var(--text-primary)]", icon: BarChart2 },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 flex items-center gap-2">
            <stat.icon className={cn("h-4 w-4 shrink-0", stat.color)} />
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
              <p className={cn("text-lg font-bold font-mono", stat.color)}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Left: buys + exits */}
        <div className="lg:col-span-3 space-y-4">
          {(data.buy_recommendations?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Buy Recommendations ({data.buy_recommendations.length})
              </h2>
              <div className="space-y-2">
                {data.buy_recommendations.map(rec => (
                  <BuyCard key={rec.ticker} rec={rec} openTickers={openTickers} onAdd={onAdd} isAdding={addingTicker} />
                ))}
              </div>
            </div>
          )}

          {(data.sell_signals?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                Exit Signals ({data.sell_signals.length})
              </h2>
              <div className="space-y-2">
                {data.sell_signals.map(sig => (
                  <ExitRow key={sig.ticker} signal={sig} onClose={onClose} isClosing={closingTicker} />
                ))}
              </div>
            </div>
          )}

          {(data.hold_positions?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                Hold ({data.hold_positions.length})
              </h2>
              <div className="space-y-1">
                {data.hold_positions.map(h => (
                  <div key={h.ticker} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                    <Link href={`/ticker/${h.ticker}`} className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{h.ticker}</Link>
                    <span className="text-xs text-[var(--text-muted)]">{h.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.buy_recommendations?.length ?? 0) === 0 && (data.sell_signals?.length ?? 0) === 0 && (
            <p className="text-center text-[var(--text-muted)] py-6 text-sm">No actionable signals.</p>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {allPending.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />Pending Breakouts ({allPending.length})
              </h3>
              <div className="space-y-2">
                {allPending.map(b => <PendingCard key={b.ticker} b={b} />)}
              </div>
            </div>
          )}

          {allRankings.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[var(--text-muted)]" />Sector Rankings
              </h3>
              <div className="divide-y divide-[var(--border)]">
                {allRankings.map(s => <SectorRow key={s.etf} s={s} max={maxScore} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RecommendationsPanel() {
  const todayStr = useMemo(() => todayYYYYMMDD(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [mobilePanel, setMobilePanel] = useState<"signals" | "history">("signals");
  const [historyDays, setHistoryDays] = useState(5);
  const [historyCursor, setHistoryCursor] = useState<string | undefined>(undefined);
  const [historyEntries, setHistoryEntries] = useState<RecommendationHistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [addingTicker, setAddingTicker] = useState<string | null>(null);
  const [closingTicker, setClosingTicker] = useState<string | null>(null);

  const regime = useRegime();
  const health = usePortfolioHealth();
  const positions = useOpenPositions();
  const historyQuery = useRecommendationHistory(historyDays, historyCursor);
  const runMutation = useRunRecommend();
  const addMutation = useAddPosition();
  const closeMutation = useClosePosition();

  // Accumulate history entries as pages load
  const freshEntries = historyQuery.data?.days;
  const historyReady = !historyQuery.isLoading && freshEntries !== undefined;

  // Merge new page into accumulated list
  const displayedEntries = useMemo(() => {
    if (!freshEntries) return historyEntries;
    const existing = new Set(historyEntries.map(e => e.date));
    const toAdd = freshEntries.filter(e => !existing.has(e.date));
    return [...historyEntries, ...toAdd].sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshEntries]);

  // Auto-select most recent when history loads
  const firstEntry = displayedEntries[0];
  const effectiveSelected = selectedDate;

  const isSelectedToday = effectiveSelected === todayStr;
  const openTickers = useMemo(() => new Set(positions.data?.positions.map(p => p.ticker) ?? []), [positions.data]);

  const handleLoadMore = useCallback(() => {
    if (historyQuery.data?.next_cursor) {
      setHistoryCursor(historyQuery.data.next_cursor);
      setHasMore(historyQuery.data.has_more);
    } else {
      // Fallback: just add more days
      setHistoryDays(d => d + 5);
    }
  }, [historyQuery.data]);

  const handleAdd = useCallback((rec: BuyRecommendation) => {
    setAddingTicker(rec.ticker);
    const payload: AddPositionRequest = {
      ticker: rec.ticker,
      entry_price: rec.entry.trigger_price,
      stop_loss: rec.risk.stop_loss,
      trailing_stop: rec.risk.trailing_stop,
      atr_14: rec.risk.atr_14,
      risk_pct: rec.risk.position_pct,
      position_pct: rec.risk.position_pct,
      shares: rec.risk.shares,
      conviction_tier: rec.conviction.tier ?? "SPECULATIVE",
      trigger_type: rec.entry.trigger_type,
      wave_position: rec.wave_position,
      sector: rec.sector,
      industry: rec.industry,
      sector_etf: rec.sector_context?.etf ?? "",
      targets: rec.risk.targets,
    };
    addMutation.mutate(payload, { onSettled: () => setAddingTicker(null) });
  }, [addMutation]);

  const handleClose = useCallback((ticker: string, reason: string) => {
    setClosingTicker(ticker);
    closeMutation.mutate({ ticker, exitReason: reason }, { onSettled: () => setClosingTicker(null) });
  }, [closeMutation]);

  const handleRun = useCallback(() => {
    runMutation.mutate({});
  }, [runMutation]);

  // Show "today" at top if not in history list
  const todayInHistory = displayedEntries.some(e => e.date === todayStr);
  const historyList: RecommendationHistoryEntry[] = useMemo(() => {
    if (todayInHistory || historyQuery.isLoading) return displayedEntries;
    // Inject a synthetic "today" placeholder at top
    return [
      { date: todayStr, date_iso: "", generated_at: "", regime: "GREEN" as RegimeColor, buy_count: 0, sell_count: 0, pending_count: 0, candidates_screened: 0 },
      ...displayedEntries,
    ];
  }, [displayedEntries, todayInHistory, todayStr, historyQuery.isLoading]);

  const canLoadMore = historyQuery.data?.has_more ?? hasMore;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Recommendations</h1>
          <p className="text-sm text-[var(--text-muted)]">Daily factor-scored signals</p>
        </div>
        <button
          onClick={handleRun}
          disabled={runMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {runMutation.isPending ? "Running…" : "Run Engine"}
        </button>
      </div>

      {/* Regime banner */}
      {regime.isLoading
        ? <div className="h-14 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        : <RegimeBanner regime={regime.data} />
      }

      {/* Portfolio health */}
      {health.data && <PortfolioHealthBar health={health.data} />}

      {/* Open positions */}
      {(positions.data?.positions?.length ?? 0) > 0 && (
        <OpenPositionsTable
          positions={positions.data!.positions}
          onClose={(ticker) => handleClose(ticker, "manual")}
          isClosing={closingTicker}
        />
      )}

      {/* Mobile panel toggle */}
      <div className="flex lg:hidden gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
        {(["signals", "history"] as const).map(panel => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
              mobilePanel === panel
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {panel === "signals" ? "Today's Signals" : "History"}
          </button>
        ))}
      </div>

      {/* Main two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Left: history feed */}
        <div className={cn("lg:col-span-2 space-y-2", mobilePanel !== "history" && "hidden lg:block")}>
          <div className="flex items-center gap-2 mb-1">
            <History className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">History</span>
            {historyQuery.isLoading && <RefreshCw className="h-3 w-3 text-[var(--text-muted)] animate-spin" />}
          </div>

          {historyList.length === 0 && !historyQuery.isLoading && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No history available yet.</p>
          )}

          {historyList.map(entry => (
            <HistoryRow
              key={entry.date}
              entry={entry}
              selected={entry.date === effectiveSelected}
              isToday={entry.date === todayStr}
              onClick={() => { setSelectedDate(entry.date); setMobilePanel("signals"); }}
            />
          ))}

          {historyQuery.isLoading && historyList.length === 0 && (
            [1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-lg bg-[var(--bg-card)] animate-pulse" />)
          )}

          {canLoadMore && !historyQuery.isLoading && (
            <button
              onClick={handleLoadMore}
              className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg border border-dashed border-[var(--border)] transition-colors flex items-center justify-center gap-1"
            >
              <ChevronRight className="h-4 w-4" />Load more
            </button>
          )}
        </div>

        {/* Right: day detail */}
        <div className={cn("lg:col-span-3", mobilePanel !== "signals" && "hidden lg:block")}>
          <DayDetail
            date={effectiveSelected}
            isToday={isSelectedToday}
            openTickers={openTickers}
            onAdd={handleAdd}
            onClose={handleClose}
            addingTicker={addingTicker}
            closingTicker={closingTicker}
            onRun={handleRun}
            isRunning={runMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
