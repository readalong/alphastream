"use client";

import { cn } from "@/lib/utils";
import type { COTPosition } from "@/lib/types";

const COT_GROUPS = [
  { key: "COMMODITIES",        label: "Commodities" },
  { key: "EQUITIES_VOLATILITY", label: "Equities & Volatility" },
  { key: "RATES_CURRENCY",     label: "Rates & Currency" },
  { key: "CRYPTO",             label: "Crypto" },
] as const;

interface COTPositionsTableProps {
  positions: COTPosition[];
}

export function COTPositionsTable({ positions }: COTPositionsTableProps) {
  return (
    <div className="space-y-5">
      {COT_GROUPS.map(({ key, label }) => {
        const group = positions.filter((p) => p.group === key);
        if (group.length === 0) return null;

        return (
          <div key={key}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              {label}
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="text-left py-1.5 font-medium">Market</th>
                  <th className="text-right py-1.5 font-medium">Net Position</th>
                  <th className="text-right py-1.5 font-medium">Stance</th>
                  <th className="text-right py-1.5 font-medium">WoW</th>
                </tr>
              </thead>
              <tbody>
                {group.map((p) => (
                  <tr key={p.market} className="border-b border-[var(--border)]/50 last:border-0">
                    <td className="py-1.5 text-[var(--text-primary)]">{p.market}</td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                      {p.net_contracts.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "py-1.5 text-right text-xs font-medium",
                        p.stance === "NET_LONG" ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {p.stance.replace("_", " ")}
                    </td>
                    <td className="py-1.5 text-right text-xs text-[var(--text-muted)] tabular-nums">
                      {p.wow_change != null
                        ? `${p.wow_change > 0 ? "+" : ""}${(p.wow_change / 1000).toFixed(1)}K`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
