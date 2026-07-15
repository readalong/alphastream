"use client";

import { useState } from "react";
import Link from "next/link";
import { Waves, TrendingUp, TrendingDown, Play, ChevronRight } from "lucide-react";
import { useFlowLeaders, useFlowExits, useRunFlowJob } from "@/hooks/use-flow";
import { MarketGaugeStrip } from "@/components/flow/market-gauge-strip";
import { FlowCard } from "@/components/flow/flow-card";
import { cn } from "@/lib/utils";
import { SECTOR_ETF_NAMES } from "@/lib/constants";

type Tab = "leaders" | "exits";

function ThemeCallout({ theme }: { theme: string }) {
  return (
    <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3">
      <p className="text-sm text-[var(--text-primary)]">
        <span className="font-medium text-[var(--accent)]">Big theme this week:</span>{" "}
        {theme}
      </p>
    </div>
  );
}

export function CapitalFlowPanel() {
  const [tab, setTab] = useState<Tab>("leaders");
  const [sectorFilter, setSectorFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");

  const leadersQ = useFlowLeaders(undefined, sectorFilter || undefined);
  const exitsQ = useFlowExits(undefined, sectorFilter || undefined);
  const runJob = useRunFlowJob();

  const activeQ = tab === "leaders" ? leadersQ : exitsQ;
  const rawStocks =
    tab === "leaders"
      ? leadersQ.data?.leaders ?? []
      : exitsQ.data?.exits ?? [];

  const minVal = minScore !== "" ? Number(minScore) : -Infinity;
  const maxVal = maxScore !== "" ? Number(maxScore) : Infinity;
  const stocks = rawStocks.filter(
    (s) => s.flow_score >= minVal && s.flow_score <= maxVal
  );

  const gauge = leadersQ.data?.market_gauge;
  const theme = leadersQ.data?.theme;
  const asOf = leadersQ.data?.as_of;

  const sectorOptions = Object.entries(SECTOR_ETF_NAMES);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Waves className="h-5 w-5 text-[var(--accent)]" />
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Capital Flow Intelligence
            </h1>
          </div>
          {asOf && (
            <p className="text-sm text-[var(--text-muted)]">As of {asOf}</p>
          )}
        </div>
        <button
          onClick={() => runJob.mutate({})}
          disabled={runJob.isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors shrink-0"
        >
          <Play className="h-3.5 w-3.5" />
          {runJob.isPending ? "Running…" : "Run Flow Job"}
        </button>
      </div>

      {/* Market Gauge Strip */}
      {gauge && <MarketGaugeStrip gauge={gauge} />}

      {/* Theme Callout */}
      {theme && <ThemeCallout theme={theme} />}

      {/* Tabs + Sector Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-[var(--border)]">
          <button
            onClick={() => setTab("leaders")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === "leaders"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Leaders
          </button>
          <button
            onClick={() => setTab("exits")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === "exits"
                ? "border-[var(--short)] text-[var(--short)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <TrendingDown className="h-4 w-4" />
            Exits
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Score range */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Score</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="min"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-8 w-16 px-2 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] tabular-nums placeholder:text-[var(--text-muted)]/50"
            />
            <span className="text-xs text-[var(--text-muted)]">–</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="max"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-8 w-16 px-2 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] tabular-nums placeholder:text-[var(--text-muted)]/50"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="">All Sectors</option>
            {sectorOptions.map(([etf, name]) => (
              <option key={etf} value={etf}>
                {etf} — {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {activeQ.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      ) : activeQ.isError ? (
        <div className="rounded-lg border border-[var(--caution)]/30 bg-[var(--caution)]/5 p-6 text-center">
          <p className="text-sm text-[var(--caution)] mb-1">Flow data not available.</p>
          <p className="text-xs text-[var(--text-muted)]">
            Run the flow job to compute scores for the current universe.
          </p>
        </div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {rawStocks.length > 0 ? "No stocks match the current score filter." : "No capital flow data yet."}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {rawStocks.length > 0
              ? "Try lowering the minimum score threshold."
              : <>Run a flow job to populate scores. <Link href="/jobs" className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline">Go to jobs<ChevronRight className="h-3 w-3" /></Link></>}
          </p>
        </div>
      ) : (
        <>
          {rawStocks.length !== stocks.length && (
            <p className="text-xs text-[var(--text-muted)]">
              Showing {stocks.length} of {rawStocks.length}
            </p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stocks.map((stock) => (
              <FlowCard key={stock.ticker} stock={stock} variant={tab} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
