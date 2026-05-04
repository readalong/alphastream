"use client";

import { cn, formatFlow } from "@/lib/utils";
import { ScoreSparkline } from "./score-sparkline";
import type { SectorFlow, SectorTier } from "@/lib/types";

const tierColors: Record<SectorTier, string> = {
  LEADING: "text-emerald-500",
  NEUTRAL: "text-[var(--text-muted)]",
  LAGGING: "text-red-500",
};

interface SectorFlowRankingsProps {
  sectors: SectorFlow[];
}

export function SectorFlowRankings({ sectors }: SectorFlowRankingsProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <th className="text-left py-2 font-medium">Rank</th>
            <th className="text-left py-2 font-medium">Sector</th>
            <th className="text-right py-2 font-medium">Score</th>
            <th className="text-right py-2 font-medium">WoW</th>
            <th className="text-right py-2 font-medium">Weekly $</th>
            <th className="text-right py-2 font-medium">Monthly $</th>
            <th className="text-right py-2 font-medium">Flow/AUM</th>
            <th className="text-right py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((s) => {
            const rankBadge =
              s.prev_rank != null && s.prev_rank !== s.rank
                ? `#${s.prev_rank}→${s.rank}`
                : `#${s.rank}`;

            return (
              <tr key={s.etf} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="py-2 text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                  {rankBadge}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                    {s.sparkline.length > 1 && (
                      <ScoreSparkline data={s.sparkline} variant="leaders" width={56} height={16} />
                    )}
                    {!s.flow_confirm && s.weekly_flow_dollars != null && (
                      <span title="Weekly and monthly flow direction diverge" className="text-amber-500 text-xs">
                        ⚠
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-right font-medium tabular-nums text-[var(--text-primary)]">
                  {s.composite_score}
                </td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums text-xs",
                    s.wow_change > 0
                      ? "text-emerald-500"
                      : s.wow_change < 0
                      ? "text-red-500"
                      : "text-[var(--text-muted)]"
                  )}
                >
                  {s.wow_change > 0 ? "+" : ""}
                  {s.wow_change}
                </td>
                <td className="py-2 text-right tabular-nums text-xs text-[var(--text-muted)]">
                  {s.weekly_flow_dollars != null ? formatFlow(s.weekly_flow_dollars) : "—"}
                </td>
                <td className="py-2 text-right tabular-nums text-xs text-[var(--text-muted)]">
                  {s.monthly_flow_dollars != null ? formatFlow(s.monthly_flow_dollars) : "—"}
                </td>
                <td className="py-2 text-right tabular-nums text-xs text-[var(--text-muted)]">
                  {s.flow_aum_pct != null ? `${s.flow_aum_pct.toFixed(1)}%` : "—"}
                </td>
                <td className={cn("py-2 text-right text-xs font-medium", tierColors[s.tier])}>
                  {s.tier}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
