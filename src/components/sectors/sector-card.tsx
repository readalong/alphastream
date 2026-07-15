"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SECTOR_ETF_NAMES, STAGE_COLORS } from "@/lib/constants";
import { useSectorTickers } from "@/hooks/use-sector-tickers";
import { parseCategory } from "@/lib/utils";
import { SectorSignalBar } from "./sector-signal-bar";
import type { SectorInfo } from "@/lib/types";

interface SectorCardProps {
  sector: SectorInfo;
  totalTickers: number;
}

export function SectorCard({ sector, totalTickers }: SectorCardProps) {
  const name = SECTOR_ETF_NAMES[sector.sector_etf] || sector.sector_names[0] || sector.sector_etf;
  const pct = totalTickers > 0 ? Math.round((sector.ticker_count / totalTickers) * 100) : 0;
  const { data } = useSectorTickers(sector.sector_etf);

  const counts: Record<string, number> = {};
  if (data?.results) {
    for (const r of data.results) {
      const cat = parseCategory(r.category);
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }

  return (
    <Link
      href={`/sectors/${sector.sector_etf}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-3 hover:border-[var(--accent)]/40 transition-colors cursor-pointer"
    >
      <div>
        <h3 className="font-medium text-[var(--text-primary)]">
          {sector.sector_etf} — {name}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {sector.ticker_count} tickers
        </p>
      </div>

      {/* Universe percentage bar */}
      <div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>{pct}% of universe</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Signal distribution */}
      {data?.results && (
        <>
          <SectorSignalBar results={data.results} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {(["S", "A", "2", "1"] as const).map((code) =>
              counts[code] ? (
                <div key={code} className="flex items-center justify-between">
                  <span style={{ color: STAGE_COLORS[code]?.color }}>
                    {STAGE_COLORS[code]?.label}
                  </span>
                  <span className="font-mono tabular-nums text-[var(--text-primary)]">
                    {counts[code]}
                  </span>
                </div>
              ) : null
            )}
          </div>
        </>
      )}

      <span className="mt-auto inline-flex items-center gap-1 text-sm text-[var(--accent)]">
        View sector
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
