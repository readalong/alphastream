"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { useSessions } from "@/hooks/use-sessions";
import { useUptrendReport } from "@/hooks/use-uptrend-report";
import { useUptrendStore } from "@/stores/uptrend-store";
import { UptrendSummaryCards } from "@/components/uptrend/uptrend-summary-cards";
import { ViewToggle } from "@/components/uptrend/view-toggle";
import { ResistanceCell } from "@/components/uptrend/resistance-cell";
import { ResistanceChartModal } from "@/components/uptrend/resistance-chart-modal";
import { SectorFilterDropdown } from "@/components/sectors/sector-filter-dropdown";
import { IndustryFilterDropdown } from "@/components/sectors/industry-filter-dropdown";
import { StageBadge } from "@/components/charts/stage-badge";
import { formatPrice, parseCategory, formatSessionDate } from "@/lib/utils";
import { ArrowUpDown, RefreshCw, BarChart3, Eye } from "lucide-react";
import type { UptrendStock } from "@/lib/types";

export default function UptrendPage() {
  const { data: sessions } = useSessions();
  const latestSession = sessions?.[0];

  const {
    viewFilter, setViewFilter,
    sectorFilter, setSectorFilter,
    industryFilter, setIndustryFilter,
    sortBy, setSortBy,
    sortDirection, toggleSortDirection,
    selectedTicker, setSelectedTicker,
    clearFilters,
  } = useUptrendStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const activeSessionId = sessionId || latestSession?.session_id || null;

  const { data: report, isLoading, isError, refetch } = useUptrendReport(activeSessionId);

  const [page, setPage] = useState(0);
  const perPage = 25;

  const filtered = useMemo(() => {
    if (!report?.stocks) return [];
    let stocks = report.stocks;

    // View filter
    if (viewFilter === "has_resistance") {
      stocks = stocks.filter((s) => s.has_resistance);
    } else if (viewFilter === "at_ath") {
      stocks = stocks.filter((s) => !s.has_resistance);
    }

    // Sector/industry
    if (sectorFilter) {
      stocks = stocks.filter((s) => s.sector_etf === sectorFilter);
    }
    if (industryFilter) {
      stocks = stocks.filter((s) => s.industry === industryFilter);
    }

    // Sort
    stocks = [...stocks].sort((a, b) => {
      // ATH stocks always at bottom
      if (a.has_resistance !== b.has_resistance) {
        return a.has_resistance ? -1 : 1;
      }

      let cmp = 0;
      if (sortBy === "r1_pct") {
        const ar1 = a.levels[0]?.pct_above ?? Infinity;
        const br1 = b.levels[0]?.pct_above ?? Infinity;
        cmp = ar1 - br1;
      } else if (sortBy === "price") {
        cmp = a.close_price - b.close_price;
      } else {
        cmp = a.ticker.localeCompare(b.ticker);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return stocks;
  }, [report, viewFilter, sectorFilter, industryFilter, sortBy, sortDirection]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  // Find divider index (first ATH stock in paged results)
  const athDividerIdx = paged.findIndex((s) => !s.has_resistance);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) toggleSortDirection();
    else setSortBy(field);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Uptrend Analysis
        </h1>
        <div className="flex items-center gap-3">
          {sessions && sessions.length > 0 && (
            <select
              value={activeSessionId || ""}
              onChange={(e) => { setSessionId(e.target.value || null); setPage(0); }}
              className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {sessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {formatSessionDate(s.session_id)}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-[var(--bg-card)] animate-pulse" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-sm text-amber-400 mb-2">No uptrend data available for this session.</p>
          <p className="text-xs text-[var(--text-muted)]">
            Run the <code className="bg-[var(--bg-primary)] px-1 rounded">--upside</code> command to generate resistance analysis.
          </p>
        </div>
      ) : report ? (
        <>
          <UptrendSummaryCards
            summary={report.summary}
            activeFilter={viewFilter}
            onFilterChange={(v) => { setViewFilter(v); setPage(0); }}
          />

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 my-4">
            <ViewToggle
              value={viewFilter}
              onChange={(v) => { setViewFilter(v); setPage(0); }}
              counts={{
                total: report.summary.total_stocks,
                withResistance: report.summary.with_resistance,
                atAth: report.summary.at_ath_no_resistance,
              }}
            />
            <SectorFilterDropdown value={sectorFilter} onChange={(v) => { setSectorFilter(v); setPage(0); }} />
            <IndustryFilterDropdown sectorEtf={sectorFilter} value={industryFilter} onChange={(v) => { setIndustryFilter(v); setPage(0); }} />
            {(viewFilter !== "all" || sectorFilter || industryFilter) && (
              <button
                onClick={() => { clearFilters(); setPage(0); }}
                className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                Clear Filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No stocks match the current filters.</p>
              <button
                onClick={() => { clearFilters(); setPage(0); }}
                className="mt-2 text-sm text-[var(--accent)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-card)]">
                      <th onClick={() => handleSort("ticker")} className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
                        <span className="flex items-center gap-1">Ticker <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th onClick={() => handleSort("price")} className="text-right px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
                        <span className="flex items-center justify-end gap-1">Price <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Sector</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Category</th>
                      <th onClick={() => handleSort("r1_pct")} className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
                        <span className="flex items-center gap-1">R1 <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">R2</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">R3</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((stock: UptrendStock, idx: number) => (
                      <Fragment key={stock.ticker}>
                        {/* ATH divider */}
                        {athDividerIdx === idx && athDividerIdx > 0 && (
                          <tr key={`divider-${idx}`}>
                            <td colSpan={8} className="px-4 py-1">
                              <div className="border-t border-dashed border-green-500/30" />
                            </td>
                          </tr>
                        )}
                        <tr
                          className="border-t border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <Link href={`/ticker/${stock.ticker}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]">
                              {stock.ticker}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--text-primary)]">
                            ${formatPrice(stock.close_price)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">
                            {stock.sector_etf}
                          </td>
                          <td className="px-4 py-2.5">
                            <StageBadge category={parseCategory(stock.category)} />
                          </td>
                          <td className="px-4 py-2.5">
                            <ResistanceCell
                              price={stock.levels[0]?.price}
                              pctAbove={stock.levels[0]?.pct_above}
                              isAth={!stock.has_resistance}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <ResistanceCell
                              price={stock.levels[1]?.price}
                              pctAbove={stock.levels[1]?.pct_above}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <ResistanceCell
                              price={stock.levels[2]?.price}
                              pctAbove={stock.levels[2]?.pct_above}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedTicker(stock.ticker)}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)]"
                                title="View resistance chart"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </button>
                              <Link
                                href={`/ticker/${stock.ticker}?tab=resistance`}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)]"
                                title="View detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-[var(--text-muted)]">{filtered.length} results</span>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`px-3 py-1 rounded text-sm ${
                          page === i
                            ? "bg-[var(--accent)] text-white"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Chart modal */}
          {selectedTicker && (
            <ResistanceChartModal
              ticker={selectedTicker}
              onClose={() => setSelectedTicker(null)}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
