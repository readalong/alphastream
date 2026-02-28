"use client";

import { useState, useMemo } from "react";
import { useSectors } from "@/hooks/use-sectors";
import { SectorCard } from "@/components/sectors/sector-card";
import { Search } from "lucide-react";
import { SECTOR_ETF_NAMES } from "@/lib/constants";

export default function SectorsPage() {
  const { data: sectors, isLoading, isError } = useSectors();
  const [search, setSearch] = useState("");

  const totalTickers = useMemo(
    () => sectors?.reduce((sum, s) => sum + s.ticker_count, 0) || 0,
    [sectors]
  );

  const filtered = useMemo(() => {
    if (!sectors) return [];
    const q = search.toLowerCase();
    return [...sectors]
      .filter((s) => {
        if (!q) return true;
        const name = SECTOR_ETF_NAMES[s.sector_etf] || s.sector_names[0] || "";
        return (
          s.sector_etf.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.ticker_count - a.ticker_count);
  }, [sectors, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Sector Analysis
        </h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sectors..."
            className="h-8 w-48 pl-8 pr-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg bg-[var(--bg-card)] animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-sm text-amber-400 mb-2">No universe data available.</p>
          <p className="text-xs text-[var(--text-muted)]">
            Run the pipeline first or{" "}
            <a href="/jobs" className="text-[var(--accent)] hover:underline">
              trigger a download job
            </a>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sector) => (
            <SectorCard
              key={sector.sector_etf}
              sector={sector}
              totalTickers={totalTickers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
