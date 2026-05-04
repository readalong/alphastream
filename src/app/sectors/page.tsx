"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSectors } from "@/hooks/use-sectors";
import { useSectorRankings } from "@/hooks/use-recommendations";
import { CMFBar } from "@/components/flow/cmf-bar";
import { SectorRotationMap } from "@/components/flow/sector-rotation-map";
import { Search, TrendingUp, TrendingDown, LayoutGrid, ScatterChart } from "lucide-react";
import { SECTOR_ETF_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SectorInfo, SectorRanking, SectorTier, SectorRotationPoint, RotationQuadrant } from "@/lib/types";

type ViewMode = "cards" | "rotation";

function toRotationPoints(rankings: SectorRanking[]): SectorRotationPoint[] {
  return rankings.map((r) => {
    const accel = r.rotation_accel ?? 0;
    const isLeading = r.tier === "LEADING";
    const isPositive = accel > 0;
    const quadrant: RotationQuadrant =
      isLeading && isPositive ? "LEADING"
      : isLeading && !isPositive ? "WEAKENING"
      : !isLeading && isPositive ? "IMPROVING"
      : "LAGGING";
    return {
      etf: r.etf,
      name: r.name,
      trend_strength: r.composite_score,
      momentum: accel,
      composite_score: r.composite_score,
      quadrant,
    };
  });
}

type SectorSort = "score" | "name" | "rotation" | "count";

const tierConfig: Record<SectorTier, { label: string; cls: string }> = {
  LEADING: { label: "Leading", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  NEUTRAL: { label: "Neutral", cls: "bg-[var(--border)] text-[var(--text-muted)] border-[var(--border)]" },
  LAGGING: { label: "Lagging", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
};

interface EnhancedSectorCardProps {
  sector: SectorInfo;
  ranking?: SectorRanking;
  totalTickers: number;
}

function EnhancedSectorCard({ sector, ranking, totalTickers }: EnhancedSectorCardProps) {
  const name = SECTOR_ETF_NAMES[sector.sector_etf] ?? sector.sector_names[0] ?? sector.sector_etf;
  const tier = ranking?.tier ?? null;
  const tierCfg = tier ? tierConfig[tier] : null;
  const hasAccel = ranking != null;
  const accelPositive = (ranking?.rotation_accel ?? 0) > 0;

  return (
    <Link href={`/sectors/${sector.sector_etf}`}>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-3 hover:border-[var(--accent)]/40 transition-colors cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-[var(--text-primary)] truncate">{name}</h3>
            <p className="text-xs text-[var(--text-muted)]">{sector.sector_etf}</p>
          </div>
          {tierCfg && (
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded border shrink-0",
                tierCfg.cls
              )}
            >
              {tierCfg.label}
            </span>
          )}
        </div>

        {/* Score + Rotation */}
        {ranking ? (
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                {ranking.composite_score}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Composite Score</div>
            </div>
            {ranking.rotation_accel != null ? (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {accelPositive ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      accelPositive ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {accelPositive ? "+" : ""}
                    {ranking.rotation_accel.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">Rotation</div>
              </div>
            ) : ranking.pct_20d != null ? (
              <div className="text-right">
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    ranking.pct_20d > 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {ranking.pct_20d > 0 ? "+" : ""}
                  {ranking.pct_20d.toFixed(1)}%
                </span>
                <div className="text-xs text-[var(--text-muted)]">20d return</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-10 flex items-center">
            <span className="text-xs text-[var(--text-muted)]">Score unavailable</span>
          </div>
        )}

        {/* vs SPY */}
        {ranking?.etf_vs_spy_20d_pct != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">vs SPY 20d</span>
            <span
              className={cn(
                "font-medium tabular-nums",
                ranking.etf_vs_spy_20d_pct > 0 ? "text-emerald-500" : "text-red-500"
              )}
            >
              {ranking.etf_vs_spy_20d_pct > 0 ? "+" : ""}
              {ranking.etf_vs_spy_20d_pct.toFixed(1)}%
            </span>
          </div>
        )}

        {/* CMF Bar */}
        {ranking?.cmf != null && <CMFBar value={ranking.cmf} />}

        {/* Ticker count */}
        <p className="text-xs text-[var(--text-muted)] mt-auto">
          {sector.ticker_count} stocks
          {totalTickers > 0 && (
            <span className="ml-1">
              · {Math.round((sector.ticker_count / totalTickers) * 100)}% of universe
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export default function SectorsPage() {
  const { data: sectors, isLoading, isError } = useSectors();
  const { data: rankingsData } = useSectorRankings();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SectorSort>("score");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const totalTickers = useMemo(
    () => sectors?.reduce((sum, s) => sum + s.ticker_count, 0) ?? 0,
    [sectors]
  );

  const merged = useMemo(() => {
    if (!sectors) return [];
    return sectors.map((s) => ({
      sector: s,
      ranking: (rankingsData?.sectors ?? rankingsData?.rankings)?.find((r) => r.etf === s.sector_etf),
    }));
  }, [sectors, rankingsData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let items = merged.filter(({ sector }) => {
      if (!q) return true;
      const name = SECTOR_ETF_NAMES[sector.sector_etf] ?? sector.sector_names[0] ?? "";
      return sector.sector_etf.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });

    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.ranking?.composite_score ?? -1) - (a.ranking?.composite_score ?? -1);
        case "name": {
          const na = SECTOR_ETF_NAMES[a.sector.sector_etf] ?? "";
          const nb = SECTOR_ETF_NAMES[b.sector.sector_etf] ?? "";
          return na.localeCompare(nb);
        }
        case "rotation":
          return (b.ranking?.rotation_accel ?? 0) - (a.ranking?.rotation_accel ?? 0);
        case "count":
          return b.sector.ticker_count - a.sector.ticker_count;
        default:
          return 0;
      }
    });

    return items;
  }, [merged, search, sortBy]);

  const rotationPoints = useMemo(() => {
    const rankings = rankingsData?.sectors ?? rankingsData?.rankings ?? [];
    return toRotationPoints(rankings);
  }, [rankingsData]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Sector Analysis</h1>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 text-sm transition-colors",
                viewMode === "cards"
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              onClick={() => setViewMode("rotation")}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 text-sm border-l border-[var(--border)] transition-colors",
                viewMode === "rotation"
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <ScatterChart className="h-3.5 w-3.5" />
              Rotation Map
            </button>
          </div>

          {viewMode === "cards" && (
            <>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SectorSort)}
                className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="score">Sort: Score</option>
                <option value="rotation">Sort: Rotation</option>
                <option value="name">Sort: Name</option>
                <option value="count">Sort: Count</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sectors…"
                  className="h-8 w-44 pl-8 pr-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {viewMode === "rotation" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
          {rotationPoints.length > 0 ? (
            <>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                X-axis: Composite Score (trend strength) · Y-axis: Rotation Acceleration (momentum) · Dot size: Composite Score
              </p>
              <SectorRotationMap points={rotationPoints} />
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              No rotation data available. Sector rankings needed.
            </p>
          )}
        </div>
      )}

      {viewMode === "cards" && isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      ) : viewMode === "cards" && isError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-sm text-amber-400 mb-2">No universe data available.</p>
          <p className="text-xs text-[var(--text-muted)]">
            Run the pipeline first or{" "}
            <a href="/jobs" className="text-[var(--accent)] hover:underline">
              trigger a download job
            </a>
            .
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ sector, ranking }) => (
            <EnhancedSectorCard
              key={sector.sector_etf}
              sector={sector}
              ranking={ranking}
              totalTickers={totalTickers}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
