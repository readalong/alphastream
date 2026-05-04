"use client";

import { cn, formatFlow } from "@/lib/utils";
import type { IndustryFlow } from "@/lib/types";

interface IndustryFlowTableProps {
  flows: IndustryFlow[];
}

export function IndustryFlowTable({ flows }: IndustryFlowTableProps) {
  const sorted = [...flows].sort((a, b) => b.flow_aum_pct - a.flow_aum_pct);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <th className="text-left py-2 font-medium">Industry (ETF)</th>
            <th className="text-right py-2 font-medium">Weekly Flow</th>
            <th className="text-right py-2 font-medium">% of AUM</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((f) => {
            const isInflow = f.weekly_flow_dollars >= 0;
            return (
              <tr key={f.etf} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="py-2">
                  <span className="font-medium text-[var(--text-primary)]">{f.etf}</span>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">{f.industry}</span>
                </td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums font-medium",
                    isInflow ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {formatFlow(f.weekly_flow_dollars)}
                </td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums text-xs",
                    isInflow ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {f.flow_aum_pct > 0 ? "+" : ""}
                  {f.flow_aum_pct.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
