"use client";

import { useState } from "react";
import { Map, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useFlowMap } from "@/hooks/use-flow";
import { useStrategyIntermarket } from "@/hooks/use-strategy";
import { MarketGaugeStrip } from "@/components/flow/market-gauge-strip";
import { FlowMapSection } from "@/components/flow/flow-map-section";
import { NoDataPlaceholder } from "@/components/flow/no-data-placeholder";
import { AssetClassFlowTable } from "@/components/flow/asset-class-flow-table";
import { COTPositionsTable } from "@/components/flow/cot-positions-table";
import { ConvergenceTable } from "@/components/flow/convergence-table";
import { SectorFlowRankings } from "@/components/flow/sector-flow-rankings";
import { SectorRotationMap } from "@/components/flow/sector-rotation-map";
import { IndustryFlowTable } from "@/components/flow/industry-flow-table";
import { InternationalFlowTable } from "@/components/flow/international-flow-table";
import { cn, formatFlow } from "@/lib/utils";
import type { FlowMapResponse } from "@/lib/types";

function IntermarketSection() {
  const { data, isLoading } = useStrategyIntermarket();

  const signalColor: Record<string, string> = {
    OUTPERFORMING: "text-[var(--long)]",
    UNDERPERFORMING: "text-[var(--short)]",
    NEUTRAL: "text-[var(--text-muted)]",
  };

  const riskColors: Record<string, string> = {
    RISK_ON:  "text-[var(--long)]",
    RISK_OFF: "text-[var(--short)]",
    NEUTRAL:  "text-[var(--caution)]",
  };

  if (isLoading) {
    return <div className="h-16 bg-[var(--bg-card)] rounded" />;
  }
  if (!data) {
    return (
      <NoDataPlaceholder message="Intermarket data not available." />
    );
  }

  const assets = [
    { label: "Gold (GLD)", data: data.gld },
    { label: "Long Bonds (TLT)", data: data.tlt },
    { label: "USD (UUP)", data: data.uup },
  ].filter((a) => a.data != null) as { label: string; data: NonNullable<typeof data.gld> }[];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">Risk signal:</span>
        <span className={cn("text-sm font-semibold", riskColors[data.risk_signal] ?? "")}>
          {data.risk_signal.replace("_", " ")}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
            <th className="text-left py-2 font-medium">Asset</th>
            <th className="text-right py-2 font-medium">vs SPY 20d</th>
            <th className="text-right py-2 font-medium">vs SPY 50d</th>
            <th className="text-right py-2 font-medium">Signal</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(({ label, data: asset }) => (
            <tr key={label} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="py-2 text-[var(--text-primary)]">{label}</td>
              <td
                className={cn(
                  "py-2 text-right tabular-nums",
                  (asset.vs_spy_20d_pct ?? 0) > 0 ? "text-[var(--long)]" : "text-[var(--short)]"
                )}
              >
                {asset.vs_spy_20d_pct != null ? `${asset.vs_spy_20d_pct > 0 ? "+" : ""}${asset.vs_spy_20d_pct.toFixed(1)}%` : "—"}
              </td>
              <td
                className={cn(
                  "py-2 text-right tabular-nums",
                  (asset.vs_spy_50d_pct ?? 0) > 0 ? "text-[var(--long)]" : "text-[var(--short)]"
                )}
              >
                {asset.vs_spy_50d_pct != null ? `${asset.vs_spy_50d_pct > 0 ? "+" : ""}${asset.vs_spy_50d_pct.toFixed(1)}%` : "—"}
              </td>
              <td
                className={cn(
                  "py-2 text-right text-xs font-medium",
                  signalColor[asset.signal] ?? ""
                )}
              >
                {asset.signal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.commentary && (
        <p className="text-xs text-[var(--text-muted)] italic">{data.commentary}</p>
      )}
    </div>
  );
}

function FlowSummaryPanel({ data }: { data: FlowMapResponse }) {
  const { data: intermarket } = useStrategyIntermarket();

  const flows = data.asset_class_flows ?? [];
  const inflows = [...flows].filter(f => f.flow_direction === "inflow")
    .sort((a, b) => b.weekly_flow_dollars - a.weekly_flow_dollars)
    .slice(0, 3);
  const outflows = [...flows].filter(f => f.flow_direction === "outflow")
    .sort((a, b) => a.weekly_flow_dollars - b.weekly_flow_dollars)
    .slice(0, 3);

  const convergence = data.convergence_signals ?? [];
  const bullishSignals = convergence.filter(c => c.signal === "BULLISH" || c.signal === "LEANING_LONG");
  const bearishSignals = convergence.filter(c => c.signal === "BEARISH" || c.signal === "LEANING_SHORT");

  const riskColors: Record<string, string> = {
    RISK_ON:  "text-[var(--long)]",
    RISK_OFF: "text-[var(--short)]",
    NEUTRAL:  "text-[var(--caution)]",
  };

  const sectorLeaders = (data.sector_flows ?? []).slice(0, 3);
  const sectorLaggards = [...(data.sector_flows ?? [])].reverse().slice(0, 3);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Capital Flow Summary</h2>
        {intermarket && (
          <span className={cn("text-xs font-semibold", riskColors[intermarket.risk_signal] ?? "text-[var(--text-muted)]")}>
            {intermarket.risk_signal.replace("_", " ")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inflows */}
        {inflows.length > 0 && (
          <div>
            <p className="text-xs text-[var(--long)] font-semibold mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Money moving into
            </p>
            <div className="space-y-1.5">
              {inflows.map(f => (
                <div key={f.asset_class} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)]">{f.asset_class}</span>
                  <span className="text-sm font-medium tabular-nums text-[var(--long)]">
                    {formatFlow(f.weekly_flow_dollars)}<span className="text-xs text-[var(--text-muted)] ml-1">/wk</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outflows */}
        {outflows.length > 0 && (
          <div>
            <p className="text-xs text-[var(--short)] font-semibold mb-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Money moving out of
            </p>
            <div className="space-y-1.5">
              {outflows.map(f => (
                <div key={f.asset_class} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)]">{f.asset_class}</span>
                  <span className="text-sm font-medium tabular-nums text-[var(--short)]">
                    {formatFlow(f.weekly_flow_dollars)}<span className="text-xs text-[var(--text-muted)] ml-1">/wk</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Convergence summary */}
      {convergence.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-muted)] font-semibold mb-2">
            ETF + futures consensus
          </p>
          <div className="flex flex-wrap gap-2">
            {bullishSignals.map(c => (
              <span key={c.market} className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--long)]/10 text-[var(--long)] border border-[var(--long)]/20">
                {c.market} ↑
              </span>
            ))}
            {bearishSignals.map(c => (
              <span key={c.market} className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--short)]/10 text-[var(--short)] border border-[var(--short)]/20">
                {c.market} ↓
              </span>
            ))}
            {convergence.filter(c => c.signal === "DIVERGENT").map(c => (
              <span key={c.market} className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--caution)]/10 text-[var(--caution)] border border-[var(--caution)]/20">
                {c.market} ~
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sector flow leaders */}
      {sectorLeaders.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-[var(--text-muted)] font-semibold">
            Leading sectors
          </p>
          {sectorLeaders.map(s => (
            <span key={s.etf} className="text-xs text-[var(--long)] font-medium">{s.etf}</span>
          ))}
          {sectorLaggards.length > 0 && (
            <>
              <span className="text-[var(--border)]">|</span>
              <p className="text-xs text-[var(--text-muted)] font-semibold">
                Lagging
              </p>
              {sectorLaggards.map(s => (
                <span key={s.etf} className="text-xs text-[var(--short)] font-medium">{s.etf}</span>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function FlowMapPanel() {
  const { data, isLoading } = useFlowMap();
  const [viewMode, setViewMode] = useState<"summary" | "full">("summary");

  return (
    <div className="space-y-5">
      {/* Mobile hint */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)]">
        <Map className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
        For the best experience, view this page on a wider screen.
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Weekly Flow Map
            </h1>
            {data?.as_of && (
              <p className="text-sm text-[var(--text-muted)]">As of {data.as_of}</p>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setViewMode("summary")}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 text-sm transition-colors",
              viewMode === "summary"
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <Minus className="h-3.5 w-3.5" />
            Summary
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 text-sm border-l border-[var(--border)] transition-colors",
              viewMode === "full"
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Full Analysis
          </button>
        </div>
      </div>

      {/* Section A: Market Summary (always visible) */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : data?.market_summary ? (
        <MarketGaugeStrip gauge={data.market_summary} />
      ) : null}

      {/* Summary view */}
      {viewMode === "summary" && (
        <>
          {isLoading ? (
            <div className="h-48 rounded-lg bg-[var(--bg-card)]" />
          ) : data ? (
            <FlowSummaryPanel data={data} />
          ) : (
            <NoDataPlaceholder message="Flow data not available. Run a flow job to populate this page." />
          )}
          <button
            onClick={() => setViewMode("full")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
            View Full Analysis ({[
              data?.asset_class_flows ? "Asset Flows" : null,
              data?.cot_positions ? "COT" : null,
              data?.convergence_signals ? "Convergence" : null,
              data?.sector_flows?.length ? "Sector Rankings" : null,
              data?.sector_rotation?.length ? "Rotation Map" : null,
              data?.industry_flows ? "Industry Flows" : null,
              data?.international_flows ? "International" : null,
              "Intermarket",
            ].filter(Boolean).join(" · ")})
          </button>
        </>
      )}

      {/* Full analysis view */}
      {viewMode === "full" && (
        <>
          {/* Section B: Asset Class Flows */}
          <FlowMapSection title="Where the Money Went" loading={isLoading}>
            {data?.asset_class_flows ? (
              <AssetClassFlowTable flows={data.asset_class_flows} />
            ) : (
              <NoDataPlaceholder message="ETF flow data not yet collected. Run a flow job with ETF flows enabled." />
            )}
          </FlowMapSection>

          {/* Section C: COT Futures Positioning */}
          <FlowMapSection title="Futures Positioning (COT)" loading={isLoading}>
            {data?.cot_positions ? (
              <COTPositionsTable positions={data.cot_positions} />
            ) : (
              <NoDataPlaceholder message="COT data not yet collected. Run a flow job with COT enabled." />
            )}
          </FlowMapSection>

          {/* Section D: ETF + COT Convergence */}
          <FlowMapSection title="ETF + COT Convergence" loading={isLoading}>
            {data?.convergence_signals ? (
              <ConvergenceTable rows={data.convergence_signals} />
            ) : (
              <NoDataPlaceholder message="Convergence signals require both ETF flow and COT data." />
            )}
          </FlowMapSection>

          {/* Section E: Sector Flow Rankings */}
          <FlowMapSection title="Sector Flow Rankings" loading={isLoading}>
            {data?.sector_flows?.length ? (
              <SectorFlowRankings sectors={data.sector_flows} />
            ) : (
              <NoDataPlaceholder message="Sector flow data not available." />
            )}
          </FlowMapSection>

          {/* Section F: Sector Rotation Map */}
          <FlowMapSection title="Sector Rotation Map" loading={isLoading}>
            {data?.sector_rotation?.length ? (
              <SectorRotationMap points={data.sector_rotation} />
            ) : (
              <NoDataPlaceholder message="Sector rotation data not available." />
            )}
          </FlowMapSection>

          {/* Section G: Industry Flows */}
          <FlowMapSection title="Under the Hood — Industry Flows" loading={isLoading}>
            {data?.industry_flows ? (
              <IndustryFlowTable flows={data.industry_flows} />
            ) : (
              <NoDataPlaceholder message="Industry ETF flow data not yet collected." />
            )}
          </FlowMapSection>

          {/* Section H: International Flows */}
          <FlowMapSection title="International Flow Spotlight" loading={isLoading}>
            {data?.international_flows ? (
              <InternationalFlowTable flows={data.international_flows} />
            ) : (
              <NoDataPlaceholder message="International ETF flow data not yet collected." />
            )}
          </FlowMapSection>

          {/* Section I: Intermarket Context */}
          <FlowMapSection title="Intermarket Context (GLD / TLT / USD)">
            <IntermarketSection />
          </FlowMapSection>

          <button
            onClick={() => setViewMode("summary")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
            Collapse to Summary
          </button>
        </>
      )}
    </div>
  );
}
