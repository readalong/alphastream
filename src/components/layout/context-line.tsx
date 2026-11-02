"use client";

/**
 * Single-line market context — replaces the stacked MarketDirectionStrip +
 * ContextStrip (Phase 1, docs/ALPHASTREAM_UX_REDESIGN.md §3.2). One quiet
 * line: date · strategy mode · VIX · GEX regime · leading sectors. Detail
 * lives on the pages, not in the chrome.
 */

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useMarketDirection } from "@/hooks/use-market-direction";
import { useSectorRankings } from "@/hooks/use-recommendations";
import { cn } from "@/lib/utils";
import type { MarketWarning } from "@/lib/types";

const SEVERITY_RANK: Record<MarketWarning["severity"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const SEVERITY_COLOR: Record<MarketWarning["severity"], string> = {
  CRITICAL: "text-[var(--severe)]",
  HIGH: "text-[var(--severe)]",
  MEDIUM: "text-[var(--caution)]",
  LOW: "text-[var(--info)]",
};

function formatWarning(w: MarketWarning): string {
  const label = w.type.replace(/_/g, " ").toLowerCase();
  return `${label} (${w.source.replace(/_/g, " ").toLowerCase()})`;
}

export function ContextLine() {
  const { data: market } = useMarketDirection();
  const { data: rankingsData } = useSectorRankings();

  const rankings = rankingsData?.sectors ?? rankingsData?.rankings ?? [];
  const leading = rankings.filter((r) => r.tier === "LEADING").slice(0, 3);

  const mode = market?.strategy_mode?.effective ?? market?.strategy_mode?.base;
  const vix = market?.vix;
  const gexRegime = market?.gex?.regime;

  const topWarning = [...(market?.warnings ?? [])].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  )[0];

  if (!market && rankings.length === 0) return null;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const modeColor =
    mode === "BULL"
      ? "text-[var(--long)]"
      : mode === "BEAR" || mode === "CORRECTION"
        ? "text-[var(--short)]"
        : "text-[var(--caution)]";

  return (
    <div className="flex items-center gap-x-4 gap-y-1 px-4 py-1.5 text-xs bg-[var(--bg-sidebar)] border-b border-[var(--border)] overflow-x-auto whitespace-nowrap text-[var(--text-muted)]">
      {topWarning ? (
        <Link
          href="/futures"
          className={cn(
            "shrink-0 inline-flex items-center gap-1 font-semibold hover:underline",
            SEVERITY_COLOR[topWarning.severity]
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {formatWarning(topWarning)}
        </Link>
      ) : (
        <span className="shrink-0">{dateLabel}</span>
      )}

      {mode && (
        <span className={cn("font-semibold shrink-0", modeColor)}>{mode}</span>
      )}

      {vix?.level != null && (
        <span className="shrink-0 tabular-nums">
          VIX {vix.level.toFixed(1)}
        </span>
      )}

      {gexRegime && (
        <Link href="/futures" className="shrink-0 hover:text-[var(--text-primary)]">
          GEX {gexRegime.replace(/_/g, " ")}
        </Link>
      )}

      {leading.length > 0 && (
        <span className="shrink-0 hidden sm:inline">
          Leading:{" "}
          {leading.map((s, i) => (
            <Link
              key={s.etf}
              href={`/sectors/${s.etf}`}
              className="text-[var(--text-primary)] hover:text-[var(--accent)]"
            >
              {s.etf}
              {i < leading.length - 1 ? ", " : ""}
            </Link>
          ))}
        </span>
      )}
    </div>
  );
}
