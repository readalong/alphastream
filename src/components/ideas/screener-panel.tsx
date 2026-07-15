"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useBatchScreen } from "@/hooks/use-screen";
import { useSessions } from "@/hooks/use-sessions";
import { useSectorTickers } from "@/hooks/use-sector-tickers";
import { UNIVERSE, CATEGORY_FILTERS } from "@/lib/constants";
import { StageBadge } from "@/components/charts/stage-badge";
import { SectorFilterDropdown } from "@/components/sectors/sector-filter-dropdown";
import { IndustryFilterDropdown } from "@/components/sectors/industry-filter-dropdown";
import { TickerDrawer } from "@/components/screener/ticker-drawer";
import { formatPrice, parseCategory, parseSignals, formatSessionDate, isTodaySession } from "@/lib/utils";
import { ArrowUpDown, Eye, ChevronRight } from "lucide-react";
import type { ScreenerResult } from "@/lib/types";

const ALL_TICKERS = [
  ...UNIVERSE.market,
  ...UNIVERSE.sectors,
  ...UNIVERSE.crypto,
  ...UNIVERSE.commodities,
];

type SortKey = "ticker" | "close_price" | "category";
type SortDir = "asc" | "desc";

export function ScreenerPanel() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [drawerTicker, setDrawerTicker] = useState<string | null>(null);
  const [drawerScreener, setDrawerScreener] = useState<ScreenerResult | null>(null);

  const { data: sessions } = useSessions();
  const [selectedSession, setSelectedSession] = useState<string>("");

  const { data: defaultData, isLoading: defaultLoading } = useBatchScreen(ALL_TICKERS, !sectorFilter);
  const { data: sectorData, isLoading: sectorLoading } = useSectorTickers(sectorFilter || "", !!sectorFilter);

  const data = sectorFilter ? sectorData : defaultData;
  const isLoading = sectorFilter ? sectorLoading : defaultLoading;

  const filtered = useMemo(() => {
    let results = data?.results || [];
    if (categoryFilter !== "All") {
      results = results.filter(
        (r) => parseCategory(r.category) === categoryFilter
      );
    }
    if (industryFilter) {
      results = results.filter((r) => r.industry === industryFilter);
    }
    results = [...results].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "ticker") cmp = a.ticker.localeCompare(b.ticker);
      else if (sortKey === "close_price") cmp = a.close_price - b.close_price;
      else if (sortKey === "category")
        cmp = parseCategory(a.category).localeCompare(parseCategory(b.category));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return results;
  }, [data, categoryFilter, industryFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        Screener
      </h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
          className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          {CATEGORY_FILTERS.map((f) => (
            <option key={f} value={f}>
              {f === "All" ? "All Stages" : f}
            </option>
          ))}
        </select>

        <SectorFilterDropdown
          value={sectorFilter}
          onChange={(v) => { setSectorFilter(v); setIndustryFilter(null); setPage(0); }}
        />
        <IndustryFilterDropdown
          sectorEtf={sectorFilter}
          value={industryFilter}
          onChange={(v) => { setIndustryFilter(v); setPage(0); }}
        />

        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>

        {sessions && sessions.length > 0 && (
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {isTodaySession(s.session_id) ? "Today (" : ""}
                {formatSessionDate(s.session_id)}
                {isTodaySession(s.session_id) ? ")" : ""}
              </option>
            ))}
          </select>
        )}

        {categoryFilter !== "All" && (
          <button
            onClick={() => setCategoryFilter("All")}
            className="px-2 py-1 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
          >
            Stage: {categoryFilter} &times;
          </button>
        )}
      </div>

      {/* Mobile hint */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2.5 mb-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)]">
        <Eye className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
        Tap the eye icon on any row to preview a ticker. Full columns visible on wider screens.
      </div>

      {/* Results Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-card)]">
                  <th
                    onClick={() => toggleSort("ticker")}
                    className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                  >
                    <span className="flex items-center gap-1">
                      Ticker <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    onClick={() => toggleSort("close_price")}
                    className="text-right px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                  >
                    <span className="flex items-center justify-end gap-1">
                      Price <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Stage</th>
                  <th
                    onClick={() => toggleSort("category")}
                    className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                  >
                    <span className="flex items-center gap-1">
                      Category <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="hidden md:table-cell text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Signals</th>
                  <th className="hidden lg:table-cell text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Sector</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r: ScreenerResult) => (
                  <tr
                    key={r.ticker}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/ticker/${r.ticker}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        {r.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--text-primary)]">
                      ${formatPrice(r.close_price)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-xs text-[var(--text-muted)]">{r.stage}</td>
                    <td className="px-4 py-2.5">
                      <StageBadge category={parseCategory(r.category)} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {parseSignals(r.signals).map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-2.5 text-xs text-[var(--text-muted)]">
                      {r.sector || "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => { setDrawerTicker(r.ticker); setDrawerScreener(r); }}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        title="Quick view"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-10">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No results match the current filters.</p>
              <p className="text-xs text-[var(--text-muted)]">
                Try broadening the filters above, or{" "}
                <Link href="/jobs" className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline">
                  trigger a new scan in jobs<ChevronRight className="h-3 w-3" />
                </Link>
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[var(--text-muted)]">
                {filtered.length} results
              </span>
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
    <TickerDrawer
      ticker={drawerTicker}
      screener={drawerScreener}
      onClose={() => { setDrawerTicker(null); setDrawerScreener(null); }}
    />
    </>
  );
}
