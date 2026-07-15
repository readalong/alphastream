"use client";

/**
 * "All Ideas" — the unified tab of /ideas (Phase 3,
 * docs/ALPHASTREAM_UX_REDESIGN.md §Phase 3 "merge the four buy-pages into
 * /ideas (normalized rank + source filter drawer)").
 *
 * Four engines rank stock ideas in incompatible native scales:
 *   - Recommendations: a conviction tier (STRONG_BUY/BUY/SPECULATIVE)
 *   - Setup Filter: a momentum_score roughly 0-40
 *   - Screener / Uptrend: a Weinstein-stage category (S/A/B/2/...)
 * This view converts all three into one transparent 0-100 "idea score" so
 * they can share one ranked queue, tagged by source rather than silently
 * blended. The conversion is intentionally simple and documented inline -
 * it is a sort key for browsing, not a claim of equivalence between the
 * engines.
 *
 * Screener only contributes once a sector is chosen (its default view is
 * index/sector/commodity ETFs, not individual stocks - see
 * src/components/ideas/screener-panel.tsx) so it never pollutes the
 * default queue with macro tickers.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useFilterSetup } from "@/hooks/use-filter";
import { useUptrendReport } from "@/hooks/use-uptrend-report";
import { useSectorTickers } from "@/hooks/use-sector-tickers";
import { useSessions } from "@/hooks/use-sessions";
import { SectorFilterDropdown } from "@/components/sectors/sector-filter-dropdown";
import { StageBadge } from "@/components/charts/stage-badge";
import { SECTOR_ETF_NAMES } from "@/lib/constants";
import { formatPrice, parseCategory, cn } from "@/lib/utils";

type Source = "recommendations" | "filter" | "screener" | "uptrend";

const SOURCE_LABEL: Record<Source, string> = {
  recommendations: "Recommendation",
  filter: "Setup Filter",
  screener: "Screener",
  uptrend: "Uptrend",
};

const SOURCE_STYLE: Record<Source, string> = {
  recommendations: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  filter: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  screener: "text-purple-400 bg-purple-500/10 border-purple-500/25",
  uptrend: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
};

// Weinstein-stage category -> a comparable 0-100 score. Only categories
// that represent an actionable bullish setup are included at all; 1D
// (dormant), 3 (distribution), 4 (downtrend) never enter the idea queue.
const CATEGORY_SCORE: Record<string, number> = {
  S: 95, A: 85, B: 75, "2": 55, X: 60, "0": 40, "1": 30,
};

const CONVICTION_SCORE: Record<string, number> = {
  STRONG_BUY: 95, BUY: 80, SPECULATIVE: 60,
};

interface IdeaRow {
  ticker: string;
  score: number;
  sources: Source[];
  sector?: string;
  close_price?: number;
  category?: string;
  note: string;
}

function mergeRow(rows: Map<string, IdeaRow>, row: IdeaRow) {
  const existing = rows.get(row.ticker);
  if (!existing) {
    rows.set(row.ticker, row);
    return;
  }
  existing.score = Math.max(existing.score, row.score);
  for (const s of row.sources) {
    if (!existing.sources.includes(s)) existing.sources.push(s);
  }
  if (row.close_price != null) existing.close_price = row.close_price;
  if (row.category) existing.category = row.category;
}

export function AllIdeasPanel() {
  const [sector, setSector] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [enabledSources, setEnabledSources] = useState<Record<Source, boolean>>({
    recommendations: true,
    filter: true,
    screener: true,
    uptrend: true,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: recs } = useRecommendations();
  const { data: filterData } = useFilterSetup(sector ? { sector } : undefined);
  const { data: sessions } = useSessions();
  const { data: uptrendReport } = useUptrendReport(sessions?.[0]?.session_id ?? null);
  const { data: sectorScreen } = useSectorTickers(sector ?? "", !!sector);

  const rows = useMemo(() => {
    const merged = new Map<string, IdeaRow>();

    if (enabledSources.recommendations) {
      for (const b of recs?.buy_recommendations ?? []) {
        // BuyRecommendation only carries a display sector name, not the
        // ETF ticker the shared filter uses - compare via the same name
        // map SectorFilterDropdown/STAGE badges use.
        if (sector && SECTOR_ETF_NAMES[sector] !== b.sector) continue;
        mergeRow(merged, {
          ticker: b.ticker,
          score: b.conviction.tier ? (CONVICTION_SCORE[b.conviction.tier] ?? 50) : 50,
          sources: ["recommendations"],
          sector: b.sector,
          close_price: b.close_price,
          category: parseCategory(b.screener_category),
          note: b.conviction.tier?.replace(/_/g, " ") ?? "recommended",
        });
      }
    }

    if (enabledSources.filter) {
      for (const f of filterData?.results ?? []) {
        // momentum_score's native scale is ~0-40 (see MomentumBadge's
        // maxScore default) - stretched to 0-100 for cross-source ranking.
        const score = Math.min(100, Math.round((f.momentum_score / 40) * 100));
        mergeRow(merged, {
          ticker: f.ticker,
          score,
          sources: ["filter"],
          sector: f.sector,
          close_price: f.close_price,
          category: parseCategory(f.category),
          note: `momentum ${f.momentum_score}`,
        });
      }
    }

    if (enabledSources.uptrend) {
      for (const u of uptrendReport?.stocks ?? []) {
        if (sector && u.sector_etf && sector !== u.sector_etf) continue;
        const cat = parseCategory(u.category);
        const base = CATEGORY_SCORE[cat];
        if (base == null) continue;
        const score = Math.min(100, base + (u.has_resistance ? 0 : 10));
        mergeRow(merged, {
          ticker: u.ticker,
          score,
          sources: ["uptrend"],
          sector: u.sector,
          close_price: u.close_price,
          category: cat,
          note: u.has_resistance ? "resistance mapped" : "clear runway (ATH)",
        });
      }
    }

    if (enabledSources.screener && sector) {
      for (const s of sectorScreen?.results ?? []) {
        const cat = parseCategory(s.category);
        const base = CATEGORY_SCORE[cat];
        if (base == null) continue;
        mergeRow(merged, {
          ticker: s.ticker,
          score: base,
          sources: ["screener"],
          sector: s.sector,
          close_price: s.close_price,
          category: cat,
          note: `stage scan: ${s.stage}`,
        });
      }
    }

    return [...merged.values()]
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [recs, filterData, uptrendReport, sectorScreen, sector, minScore, enabledSources]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--text-muted)]">
          {rows.length} idea{rows.length === 1 ? "" : "s"} across{" "}
          {Object.values(enabledSources).filter(Boolean).length} source
          {Object.values(enabledSources).filter(Boolean).length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
            drawerOpen
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {drawerOpen && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Sector</label>
              <SectorFilterDropdown value={sector} onChange={setSector} />
              {!sector && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Pick a sector to include Screener picks from it.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                Min idea score — {minScore}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Sources</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setEnabledSources((prev) => ({ ...prev, [s]: !prev[s] }))
                  }
                  className={cn(
                    "text-xs px-2.5 py-1 rounded border",
                    enabledSources[s]
                      ? SOURCE_STYLE[s]
                      : "border-[var(--border)] text-[var(--text-muted)] opacity-50"
                  )}
                >
                  {SOURCE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
              <th className="text-left font-normal px-3 py-2">Ticker</th>
              <th className="text-left font-normal px-3 py-2 hidden sm:table-cell">Sector</th>
              <th className="text-left font-normal px-3 py-2">Source</th>
              <th className="text-left font-normal px-3 py-2 hidden md:table-cell">Note</th>
              <th className="text-right font-normal px-3 py-2">Price</th>
              <th className="text-right font-normal px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((r) => (
              <tr key={r.ticker} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)]">
                <td className="px-3 py-2">
                  <Link
                    href={`/ticker/${r.ticker}`}
                    className="font-mono font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
                  >
                    {r.ticker}
                  </Link>
                  {r.category && <span className="ml-2"><StageBadge category={r.category} /></span>}
                </td>
                <td className="px-3 py-2 text-[var(--text-muted)] hidden sm:table-cell">{r.sector ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.sources.map((s) => (
                      <span
                        key={s}
                        className={cn("text-[10px] px-1.5 py-0.5 rounded border", SOURCE_STYLE[s])}
                      >
                        {SOURCE_LABEL[s]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-[var(--text-muted)] hidden md:table-cell">{r.note}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--text-primary)]">
                  {r.close_price != null ? `$${formatPrice(r.close_price)}` : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                  {r.score}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                  No ideas match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
