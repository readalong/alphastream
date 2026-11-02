import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Zap } from "lucide-react";
import type { CANSLIMCriterion, DataQuality } from "@/lib/types";

type CriterionKey = "C" | "A" | "N" | "S" | "L" | "I" | "M";

const CRITERION_LABELS: Record<CriterionKey, string> = {
  C: "Current EPS",
  A: "Annual EPS",
  N: "New High",
  S: "Supply",
  L: "Leader",
  I: "Institutional",
  M: "Market",
};

function formatFloat(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

function getPrimaryMetric(key: CriterionKey, c: CANSLIMCriterion, dq: DataQuality): React.ReactNode {
  if ((key === "C" || key === "A") && dq === "PROXY_ONLY") {
    return <span className="text-[var(--text-muted)]">Proxy only</span>;
  }

  switch (key) {
    case "C":
      return c.eps_growth_yoy != null ? (
        <span className="flex items-center gap-1">
          EPS {c.eps_growth_yoy >= 0 ? "+" : ""}{c.eps_growth_yoy.toFixed(0)}%
          {c.eps_accelerating && <span title="Accelerating"><Zap className="h-3 w-3 text-amber-400" /></span>}
        </span>
      ) : "—";
    case "A":
      return c.eps_cagr_3y != null
        ? `CAGR ${c.eps_cagr_3y >= 0 ? "+" : ""}${c.eps_cagr_3y.toFixed(0)}%`
        : "—";
    case "N":
      return c.near_52w_high
        ? "At 52w high ✓"
        : c.pct_from_high != null
          ? `${c.pct_from_high.toFixed(1)}% from high`
          : "—";
    case "S":
      return c.float_shares != null
        ? `${formatFloat(c.float_shares)} float`
        : c.pocket_pivot ? "Pocket pivot ✓" : "—";
    case "L":
      return c.rs_percentile != null
        ? `RS ${c.rs_percentile}th${c.rs_52w_high ? " ★" : ""}`
        : "—";
    case "I":
      return c.cmf_20 != null
        ? `CMF ${c.cmf_20.toFixed(2)}`
        : c.pocket_pivot ? "Pocket pivot ✓" : "—";
    case "M":
      return c.regime ? (
        <span className={
          c.regime === "GREEN" ? "text-emerald-400"
          : c.regime === "RED" ? "text-red-400"
          : "text-amber-400"
        }>
          {c.regime}
        </span>
      ) : "—";
  }
}

function getSecondaryMetric(key: CriterionKey, c: CANSLIMCriterion): string | null {
  switch (key) {
    case "C": return c.revenue_growth_yoy != null ? `Rev ${c.revenue_growth_yoy >= 0 ? "+" : ""}${c.revenue_growth_yoy.toFixed(0)}%` : null;
    case "A": return c.roe != null ? `ROE ${(c.roe * 100).toFixed(0)}%` : null;
    case "S": return c.short_ratio != null ? `Short ${c.short_ratio.toFixed(1)}x` : null;
    case "L": return c.sector_tier ?? null;
    case "I": return c.sector_flow ? `Flow: ${c.sector_flow}` : null;
    case "M": return c.vix_level ?? null;
    default:  return null;
  }
}

interface CriteriaCellProps {
  letter: CriterionKey;
  criterion: CANSLIMCriterion;
  dataQuality: DataQuality;
}

export function CriteriaCell({ letter, criterion, dataQuality }: CriteriaCellProps) {
  const pass = criterion.pass;
  const primary = getPrimaryMetric(letter, criterion, dataQuality);
  const secondary = getSecondaryMetric(letter, criterion);

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 flex flex-col gap-1",
        pass
          ? "bg-emerald-500/8 border-emerald-500/20"
          : "bg-red-500/8 border-red-500/20"
      )}
    >
      {/* Letter + pass/fail icon */}
      <div className="flex items-center justify-between">
        <span className={cn("text-xl font-black leading-none", pass ? "text-emerald-400" : "text-red-400")}>
          {letter}
        </span>
        {pass
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          : <XCircle     className="h-3.5 w-3.5 text-red-400 shrink-0" />
        }
      </div>

      {/* Label */}
      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider leading-none">
        {CRITERION_LABELS[letter]}
      </p>

      {/* Primary metric */}
      <p className={cn("text-[11px] font-medium leading-snug", pass ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
        {primary}
      </p>

      {/* Secondary metric */}
      {secondary && (
        <p className="text-[10px] text-[var(--text-muted)] leading-snug truncate">{secondary}</p>
      )}
    </div>
  );
}
