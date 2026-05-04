"use client";

import Link from "next/link";
import { useMarketDirection } from "@/hooks/use-market-direction";
import { useSectorRankings } from "@/hooks/use-recommendations";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function ContextStrip() {
  const { data: market } = useMarketDirection();
  const { data: rankingsData } = useSectorRankings();

  const rankings = rankingsData?.sectors ?? rankingsData?.rankings ?? [];
  const leading = rankings.filter((r) => r.tier === "LEADING").slice(0, 3);
  const lagging = rankings.filter((r) => r.tier === "LAGGING").slice(0, 2);

  const mode = market?.strategy_mode?.effective ?? market?.strategy_mode?.base;
  const vix = market?.vix;

  const modeColor =
    mode === "BULL" ? "text-emerald-400"
    : mode === "BEAR" || mode === "CORRECTION" ? "text-red-400"
    : "text-amber-400";

  if (!market && rankings.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 text-[11px] bg-[var(--bg-sidebar)] border-b border-[var(--border)] overflow-x-auto whitespace-nowrap">
      {/* Strategy mode */}
      {mode && (
        <span className={cn("font-semibold tracking-wider shrink-0", modeColor)}>
          {mode}
        </span>
      )}

      {/* VIX */}
      {vix?.level != null && (
        <span className={cn(
          "shrink-0",
          vix.regime === "LOW" ? "text-emerald-400"
          : vix.regime === "HIGH" || vix.regime === "CRISIS" ? "text-red-400"
          : "text-amber-400"
        )}>
          VIX {vix.level.toFixed(1)} <span className="text-[var(--text-muted)]">({vix.regime})</span>
        </span>
      )}

      {(mode || vix) && (leading.length > 0 || lagging.length > 0) && (
        <span className="text-[var(--border)] shrink-0">|</span>
      )}

      {/* Leading sectors */}
      {leading.length > 0 && (
        <span className="flex items-center gap-1 shrink-0">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          {leading.map((r, i) => (
            <span key={r.etf}>
              <Link
                href={`/sectors/${r.etf}`}
                className="text-emerald-400 hover:underline font-medium"
              >
                {r.etf}
              </Link>
              {r.pct_20d != null && (
                <span className="text-emerald-500/70 ml-0.5">
                  +{r.pct_20d.toFixed(1)}%<span className="text-[var(--text-muted)] text-[9px] ml-0.5">20d</span>
                </span>
              )}
              {i < leading.length - 1 && <span className="text-[var(--text-muted)] mx-1">·</span>}
            </span>
          ))}
        </span>
      )}

      {/* Lagging sectors */}
      {lagging.length > 0 && (
        <span className="flex items-center gap-1 shrink-0">
          <TrendingDown className="h-3 w-3 text-red-500" />
          {lagging.map((r, i) => (
            <span key={r.etf}>
              <Link
                href={`/sectors/${r.etf}`}
                className="text-red-400 hover:underline font-medium"
              >
                {r.etf}
              </Link>
              {r.pct_20d != null && (
                <span className="text-red-500/70 ml-0.5">
                  {r.pct_20d.toFixed(1)}%<span className="text-[var(--text-muted)] text-[9px] ml-0.5">20d</span>
                </span>
              )}
              {i < lagging.length - 1 && <span className="text-[var(--text-muted)] mx-1">·</span>}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
