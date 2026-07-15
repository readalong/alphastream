"use client";

import { cn, formatFlow } from "@/lib/utils";
import type { AssetClassFlow } from "@/lib/types";

interface AssetClassFlowTableProps {
  flows: AssetClassFlow[];
}

export function AssetClassFlowTable({ flows }: AssetClassFlowTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <th className="text-left py-2 font-medium">Asset Class</th>
            <th className="text-left py-2 font-medium">Key ETFs</th>
            <th className="text-right py-2 font-medium">Weekly Flow</th>
            <th className="text-right py-2 font-medium">Daily Flow</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f) => (
            <tr key={f.asset_class} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="py-2 text-[var(--text-primary)]">{f.asset_class}</td>
              <td className="py-2 text-xs text-[var(--text-muted)]">{f.key_etfs.join(", ")}</td>
              <td
                className={cn(
                  "py-2 text-right font-medium tabular-nums",
                  f.flow_direction === "inflow" ? "text-[var(--long)]" : "text-[var(--short)]"
                )}
              >
                {formatFlow(f.weekly_flow_dollars)}
              </td>
              <td
                className={cn(
                  "py-2 text-right tabular-nums",
                  f.flow_direction === "inflow" ? "text-[var(--long)]" : "text-[var(--short)]"
                )}
              >
                {formatFlow(f.daily_flow_dollars)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
