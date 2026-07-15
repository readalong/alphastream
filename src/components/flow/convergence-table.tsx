"use client";

import { cn, formatFlow } from "@/lib/utils";
import type { ConvergenceRow, ConvergenceSignal } from "@/lib/types";

const signalConfig: Record<ConvergenceSignal, { label: string; color: string }> = {
  BULLISH:       { label: "Bullish",       color: "text-[var(--long)]" },
  BEARISH:       { label: "Bearish",       color: "text-[var(--short)]" },
  DIVERGENT:     { label: "Divergent",     color: "text-[var(--caution)]" },
  LEANING_LONG:  { label: "Leaning long",  color: "text-[var(--info)]" },
  LEANING_SHORT: { label: "Leaning short", color: "text-[var(--severe)]" },
};

function getVerdict(signal: ConvergenceSignal, etfDir: string, cotStance: string): string {
  switch (signal) {
    case "BULLISH":
      return "Both institutional ETF buyers and futures longs agree. Strong setup.";
    case "BEARISH":
      return "Both institutional ETF sellers and futures shorts agree. Avoid longs.";
    case "LEANING_LONG":
      return "Mild bullish lean — more buyers than sellers, but not full conviction.";
    case "LEANING_SHORT":
      return "Mild bearish lean — more sellers than buyers, but not full conviction.";
    case "DIVERGENT":
      return etfDir === "inflow"
        ? "ETF inflows but futures short — smart money diverging. Wait for clarity."
        : "ETF outflows but futures long — mixed signals. Avoid new positions.";
    default:
      return "";
  }
}

interface ConvergenceTableProps {
  rows: ConvergenceRow[];
}

export function ConvergenceTable({ rows }: ConvergenceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <th className="text-left py-2 font-medium">Market</th>
            <th className="text-right py-2 font-medium">ETF Weekly Flow</th>
            <th className="text-right py-2 font-medium">COT Net</th>
            <th className="text-right py-2 font-medium">Signal</th>
            <th className="text-left py-2 pl-4 font-medium">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cfg = signalConfig[r.signal];
            return (
              <tr key={r.market} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="py-2 text-[var(--text-primary)]">{r.market}</td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums font-medium",
                    r.etf_flow_direction === "inflow" ? "text-[var(--long)]" : "text-[var(--short)]"
                  )}
                >
                  {formatFlow(r.etf_weekly_flow)}
                </td>
                <td className="py-2 text-right text-[var(--text-muted)] tabular-nums">
                  {r.cot_net.toLocaleString()}{" "}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      r.cot_stance === "NET_LONG" ? "text-[var(--long)]" : "text-[var(--short)]"
                    )}
                  >
                    ({r.cot_stance.replace("_", " ")})
                  </span>
                </td>
                <td className={cn("py-2 text-right text-xs font-medium", cfg.color)}>
                  {cfg.label}
                </td>
                <td className="py-2 pl-4 text-xs text-[var(--text-muted)] max-w-[220px]">
                  {getVerdict(r.signal, r.etf_flow_direction, r.cot_stance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
