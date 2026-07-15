"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useIndustryTickers } from "@/hooks/use-industry-tickers";
import { SectorBreadcrumb } from "@/components/sectors/sector-breadcrumb";
import { StageBadge } from "@/components/charts/stage-badge";
import { STAGE_COLORS } from "@/lib/constants";
import { formatPrice, parseCategory, parseSignals } from "@/lib/utils";
import { Eye } from "lucide-react";
import type { ScreenerResult } from "@/lib/types";

export default function IndustryDetailPage() {
  const params = useParams();
  const sectorEtf = params.sector_etf as string;
  const industry = decodeURIComponent(params.industry as string);

  const { data, isLoading } = useIndustryTickers(industry);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (data?.results) {
      for (const r of data.results) {
        const cat = parseCategory(r.category);
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [data]);

  return (
    <div>
      <SectorBreadcrumb sectorEtf={sectorEtf} industry={industry} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          {industry}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {data?.count || "..."} tickers &middot; Sector: {sectorEtf}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : data?.results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">No tickers found in this industry.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-card)]">
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Ticker</th>
                  <th className="text-right px-4 py-2.5 font-medium text-[var(--text-muted)]">Price</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Stage</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Signals</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data?.results.map((r: ScreenerResult) => (
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

          {/* Stage summary bar */}
          <div className="flex flex-wrap items-center gap-3 mt-4 px-2">
            {Object.entries(stageCounts)
              .sort(([a], [b]) => {
                const order = ["S", "A", "B", "X", "2", "1", "1D", "0", "3", "4"];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([code, count]) => (
                <span
                  key={code}
                  className="text-xs font-medium"
                  style={{ color: STAGE_COLORS[code]?.color || "var(--text-faint)" }}
                >
                  {STAGE_COLORS[code]?.label || code}: {count}
                </span>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
