"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useOpenPositions,
  usePortfolioHealth,
  useClosePosition,
} from "@/hooks/use-recommendations";
import { cn, formatPrice } from "@/lib/utils";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  AlertTriangle,
  Target,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import type { OpenPosition, PortfolioHealthResponse } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function riskColor(riskPct: number) {
  if (riskPct > 0.025) return "text-red-400";
  if (riskPct > 0.015) return "text-amber-400";
  return "text-emerald-400";
}

function heatBar(pct: number, max: number) {
  const ratio = Math.min(pct / max, 1);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            ratio > 0.8 ? "bg-red-500" : ratio > 0.5 ? "bg-amber-400" : "bg-emerald-500"
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-[var(--text-muted)] w-10 text-right">
        {(pct * 100).toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Portfolio Health ──────────────────────────────────────────────────────────

function PortfolioHealthPanel({ health }: { health: PortfolioHealthResponse }) {
  const { capacity, sector_breakdown, total_heat_pct, total_positions } = health;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Portfolio Health</h2>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open Positions", value: total_positions, suffix: `/ ${capacity.positions_remaining + total_positions}` },
          { label: "Total Heat", value: `${(total_heat_pct * 100).toFixed(1)}%`, suffix: `of ${(capacity.max_heat_pct * 100).toFixed(0)}% max` },
          { label: "Slots Remaining", value: capacity.positions_remaining },
          { label: "Heat Remaining", value: `${(capacity.heat_remaining_pct * 100).toFixed(1)}%` },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
            {suffix && <p className="text-[10px] text-[var(--text-muted)]">{suffix}</p>}
          </div>
        ))}
      </div>

      {/* Overall heat bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[var(--text-muted)]">Portfolio heat</span>
          <span className="text-xs text-[var(--text-muted)]">max {(capacity.max_heat_pct * 100).toFixed(0)}%</span>
        </div>
        {heatBar(total_heat_pct, capacity.max_heat_pct)}
      </div>

      {/* Sector breakdown */}
      {Object.keys(sector_breakdown).length > 0 && (
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> Sector Concentration
          </p>
          <div className="space-y-2">
            {Object.entries(sector_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([sector, pct]) => (
                <div key={sector}>
                  <div className="flex justify-between items-center mb-0.5">
                    <Link href={`/sectors/${sector}`} className="text-xs text-[var(--accent)] hover:underline">
                      {sector}
                    </Link>
                    <span className={cn(
                      "text-xs tabular-nums font-medium",
                      pct > capacity.max_per_sector ? "text-red-400" : "text-[var(--text-muted)]"
                    )}>
                      {(pct * 100).toFixed(1)}%
                      {pct > capacity.max_per_sector && " ⚠"}
                    </span>
                  </div>
                  {heatBar(pct, capacity.max_per_sector)}
                </div>
              ))}
          </div>
        </div>
      )}

      {health.days_since_regime_change > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {health.days_since_regime_change} day{health.days_since_regime_change !== 1 ? "s" : ""} since last regime change
          {health.highest_concentration && ` · Highest concentration: ${health.highest_concentration}`}
        </p>
      )}
    </div>
  );
}

// ─── Position card (mobile) / row (desktop) ───────────────────────────────────

function PositionRow({
  pos,
  onClose,
  isClosing,
}: {
  pos: OpenPosition;
  onClose: () => void;
  isClosing: boolean;
}) {
  const days = daysSince(pos.added_at);
  const riskPct = pos.risk_pct;
  const stopDist = ((pos.entry_price - pos.stop_loss) / pos.entry_price) * 100;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="space-y-2 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/ticker/${pos.ticker}`}
            className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            {pos.ticker}
          </Link>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)]">
            {pos.conviction_tier.replace(/_/g, " ")}
          </span>
          <span className="text-[10px] text-purple-400">{pos.wave_position}</span>
          <span className="text-[10px] text-[var(--text-muted)] ml-auto">{days}d held</span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-[var(--text-muted)]">Entry </span>
            <span className="font-mono font-medium text-[var(--text-primary)]">
              ${formatPrice(pos.entry_price)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Stop </span>
            <span className="font-mono font-medium text-red-400">
              ${formatPrice(pos.stop_loss)} <span className="text-[var(--text-muted)]">(-{stopDist.toFixed(1)}%)</span>
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Risk </span>
            <span className={cn("font-mono font-medium", riskColor(riskPct))}>
              {(riskPct * 100).toFixed(2)}% of capital
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Size </span>
            <span className="font-mono font-medium text-[var(--text-primary)]">
              {(pos.position_pct * 100).toFixed(1)}%
              {pos.shares > 0 && <span className="text-[var(--text-muted)] ml-1">({pos.shares} sh)</span>}
            </span>
          </div>
        </div>

        {/* Targets */}
        {pos.targets.length > 0 && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Target className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
            {pos.targets.map((t, i) => (
              <span key={i} className="text-emerald-400 font-mono">
                R{i + 1} ${formatPrice(t.price)}{" "}
                <span className="text-emerald-500/60">(+{t.pct_gain.toFixed(1)}%)</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="flex items-start pt-1">
        <button
          onClick={onClose}
          disabled={isClosing}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-40"
          title="Close position"
        >
          {isClosing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [closingTicker, setClosingTicker] = useState<string | null>(null);

  const { data: positionsData, isLoading: posLoading } = useOpenPositions(refreshKey);
  const { data: health, isLoading: healthLoading } = usePortfolioHealth(refreshKey);
  const closeMutation = useClosePosition();

  const positions = positionsData?.positions ?? [];
  const isLoading = posLoading || healthLoading;

  async function handleClose(ticker: string) {
    setClosingTicker(ticker);
    try {
      await closeMutation.mutateAsync({ ticker, exitReason: "manual" });
      setRefreshKey(k => k + 1);
    } finally {
      setClosingTicker(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Portfolio</h1>
        </div>
        <Link
          href="/ideas?tab=recommendations"
          className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          Recommendations →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-48 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          <div className="h-64 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        </div>
      ) : (
        <>
          {/* Health panel */}
          {health && <PortfolioHealthPanel health={health} />}

          {/* Positions */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Open Positions
                </h2>
                {positions.length > 0 && (
                  <span className="text-xs text-[var(--text-muted)]">({positions.length})</span>
                )}
              </div>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingDown className="h-8 w-8 text-[var(--text-muted)]/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No open positions</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Add positions from{" "}
                  <Link href="/ideas?tab=recommendations" className="text-[var(--accent)] hover:underline">
                    Recommendations →
                  </Link>
                </p>
              </div>
            ) : (
              <>
                {/* Risk warning */}
                {positions.some(p => p.risk_pct > 0.025) && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/5 border-b border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">
                      {positions.filter(p => p.risk_pct > 0.025).length} position
                      {positions.filter(p => p.risk_pct > 0.025).length !== 1 ? "s" : ""}{" "}
                      above 2.5% risk threshold — consider sizing down.
                    </p>
                  </div>
                )}
                <div className="divide-y-0">
                  {positions.map(pos => (
                    <PositionRow
                      key={pos.ticker}
                      pos={pos}
                      onClose={() => handleClose(pos.ticker)}
                      isClosing={closingTicker === pos.ticker}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
