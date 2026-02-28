"use client";

import Link from "next/link";
import { useSectors } from "@/hooks/use-sectors";
import { useSectorTickers } from "@/hooks/use-sector-tickers";
import { SECTOR_ETF_NAMES, STAGE_COLORS } from "@/lib/constants";
import { parseCategory } from "@/lib/utils";
import type { SectorInfo } from "@/lib/types";

function SectorRow({ sector }: { sector: SectorInfo }) {
  const name = SECTOR_ETF_NAMES[sector.sector_etf] || sector.sector_names[0];
  const { data } = useSectorTickers(sector.sector_etf);

  const counts: Record<string, number> = {};
  if (data?.results) {
    for (const r of data.results) {
      const cat = parseCategory(r.category);
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }

  return (
    <tr className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-primary)]/40 transition-colors">
      <td className="px-4 py-2">
        <Link
          href={`/sectors/${sector.sector_etf}`}
          className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
        >
          {sector.sector_etf} {name}
        </Link>
      </td>
      <td className="px-4 py-2 text-center font-mono tabular-nums text-sm" style={{ color: STAGE_COLORS.S.color }}>
        {counts.S || "—"}
      </td>
      <td className="px-4 py-2 text-center font-mono tabular-nums text-sm" style={{ color: STAGE_COLORS.A.color }}>
        {counts.A || "—"}
      </td>
      <td className="px-4 py-2 text-center font-mono tabular-nums text-sm" style={{ color: STAGE_COLORS["2"].color }}>
        {counts["2"] || "—"}
      </td>
      <td className="px-4 py-2 text-center font-mono tabular-nums text-sm text-[var(--text-muted)]">
        {sector.ticker_count}
      </td>
    </tr>
  );
}

export function SectorSummaryTable() {
  const { data: sectors, isLoading } = useSectors();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-[var(--bg-primary)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!sectors?.length) return null;

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Top Signals by Sector
        </h2>
        <Link href="/sectors" className="text-xs text-[var(--accent)] hover:underline">
          View All Sectors &rarr;
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <th className="text-left font-medium px-4 py-2">Sector</th>
            <th className="text-center font-medium px-4 py-2">Sure Shot</th>
            <th className="text-center font-medium px-4 py-2">Action</th>
            <th className="text-center font-medium px-4 py-2">Stage 2</th>
            <th className="text-center font-medium px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {sectors.slice(0, 6).map((s) => (
            <SectorRow key={s.sector_etf} sector={s} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
