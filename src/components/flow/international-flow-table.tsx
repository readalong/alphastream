"use client";

import { cn, formatFlow } from "@/lib/utils";
import type { InternationalFlow } from "@/lib/types";

interface InternationalFlowTableProps {
  flows: InternationalFlow[];
}

export function InternationalFlowTable({ flows }: InternationalFlowTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <th className="text-left py-2 font-medium">Region / Country</th>
            <th className="text-left py-2 font-medium">ETF</th>
            <th className="text-right py-2 font-medium">Weekly Flow</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f) => (
            <tr key={f.etf} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="py-2 text-[var(--text-primary)]">{f.region}</td>
              <td className="py-2 text-xs text-[var(--text-muted)]">{f.etf}</td>
              <td
                className={cn(
                  "py-2 text-right tabular-nums font-medium",
                  f.flow_direction === "inflow" ? "text-[var(--long)]" : "text-[var(--short)]"
                )}
              >
                {formatFlow(f.weekly_flow_dollars)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
