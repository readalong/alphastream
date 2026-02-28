"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSectorTickers } from "@/hooks/use-sector-tickers";
import { useIndustries } from "@/hooks/use-industries";
import { useChart } from "@/hooks/use-chart";
import { useSessions } from "@/hooks/use-sessions";
import { SectorBreadcrumb } from "@/components/sectors/sector-breadcrumb";
import { IndustryCard } from "@/components/sectors/industry-card";
import { StageBadge } from "@/components/charts/stage-badge";
import { StaticChart } from "@/components/charts/static-chart";
import { SECTOR_ETF_NAMES, CATEGORY_FILTERS } from "@/lib/constants";
import { formatPrice, parseCategory, parseSignals, formatSessionDate, isTodaySession } from "@/lib/utils";
import { ArrowUpDown, Eye } from "lucide-react";
import type { ScreenerResult } from "@/lib/types";

type Tab = "screener" | "industries" | "chart" | "sessions";
type SortKey = "ticker" | "close_price" | "category";
type SortDir = "asc" | "desc";

export default function SectorDetailPage() {
  const params = useParams();
  const sectorEtf = params.sector_etf as string;
  const sectorName = SECTOR_ETF_NAMES[sectorEtf] || sectorEtf;

  const [tab, setTab] = useState<Tab>("screener");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const { data, isLoading } = useSectorTickers(sectorEtf);
  const { data: industries } = useIndustries(sectorEtf);
  const { data: chartData, isLoading: chartLoading } = useChart(sectorEtf, tab === "chart");
  const { data: sessions } = useSessions();

  // Get unique industries from results
  const resultIndustries = useMemo(() => {
    if (!data?.results) return [];
    const set = new Set(data.results.map((r) => r.industry).filter(Boolean));
    return [...set].sort() as string[];
  }, [data]);

  const filtered = useMemo(() => {
    let results = data?.results || [];
    if (categoryFilter !== "All") {
      results = results.filter((r) => parseCategory(r.category) === categoryFilter);
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
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "screener", label: "Screener Results" },
    { key: "industries", label: "Industries" },
    { key: "chart", label: "Sector Chart" },
    { key: "sessions", label: "Sessions" },
  ];

  return (
    <div>
      <SectorBreadcrumb sectorEtf={sectorEtf} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          {sectorEtf} — {sectorName}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {data?.count || "..."} tickers &middot; Sector ETF: {sectorEtf}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Screener tab */}
      {tab === "screener" && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
              className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {CATEGORY_FILTERS.map((f) => (
                <option key={f} value={f}>{f === "All" ? "All Stages" : f}</option>
              ))}
            </select>
            <select
              value={industryFilter}
              onChange={(e) => { setIndustryFilter(e.target.value); setPage(0); }}
              className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">All Industries</option>
              {resultIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
              className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-[var(--bg-card)] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No stocks match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-card)]">
                      <th onClick={() => toggleSort("ticker")} className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
                        <span className="flex items-center gap-1">Ticker <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th onClick={() => toggleSort("close_price")} className="text-right px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
                        <span className="flex items-center justify-end gap-1">Price <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Stage</th>
                      <th onClick={() => toggleSort("category")} className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
                        <span className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Signals</th>
                      <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Industry</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r: ScreenerResult) => (
                      <tr key={r.ticker} className="border-t border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/ticker/${r.ticker}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]">
                            {r.ticker}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--text-primary)]">
                          ${formatPrice(r.close_price)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{r.stage}</td>
                        <td className="px-4 py-2.5"><StageBadge category={parseCategory(r.category)} /></td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {parseSignals(r.signals).map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)]">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{r.industry || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Link href={`/ticker/${r.ticker}`} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)]">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
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
        </>
      )}

      {/* Industries tab */}
      {tab === "industries" && (
        <div>
          {industries?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {industries.map((ind) => (
                <IndustryCard key={ind.industry} industry={ind} sectorEtf={sectorEtf} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No industries found.</p>
            </div>
          )}
        </div>
      )}

      {/* Chart tab */}
      {tab === "chart" && (
        <div className="max-w-4xl">
          {chartLoading ? (
            <div className="h-96 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          ) : chartData ? (
            <StaticChart base64={chartData.chart_base64} alt={`${sectorEtf} chart`} />
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">Chart not available for {sectorEtf}.</p>
            </div>
          )}
        </div>
      )}

      {/* Sessions tab */}
      {tab === "sessions" && (
        <div>
          {sessions?.length ? (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-card)]">
                    <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Session</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Created</th>
                    <th className="text-center px-4 py-2.5 font-medium text-[var(--text-muted)]">Charts</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.session_id} className="border-t border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {isTodaySession(s.session_id) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">Today</span>
                          )}
                          <span className="text-[var(--text-primary)]">{formatSessionDate(s.session_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{s.created_at}</td>
                      <td className="px-4 py-2.5 text-center font-mono tabular-nums text-[var(--text-primary)]">{s.chart_count}</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/sessions/${s.session_id}`} className="text-xs text-[var(--accent)] hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No sessions found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
