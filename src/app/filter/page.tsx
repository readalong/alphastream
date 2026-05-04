"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Filter, Play, ArrowUpDown, CheckCircle2, Bookmark, X } from "lucide-react";
import { useFilterSetup } from "@/hooks/use-filter";
import { FunnelSummary } from "@/components/filter/funnel-summary";
import { SectorContextStrip } from "@/components/filter/sector-context-strip";
import { MomentumBadge } from "@/components/filter/momentum-badge";
import { StageBadge } from "@/components/charts/stage-badge";
import { cn, parseCategory } from "@/lib/utils";
import { SECTOR_ETF_NAMES } from "@/lib/constants";
import { api } from "@/lib/api-client";
import type { FilterResult, FilterParams } from "@/lib/types";

interface FilterPreset {
  id: string;
  name: string;
  sector: string;
  category: string;
  minAdv: number;
  requireRs52w: boolean;
  limit: number;
  minMomentum: number;
  builtin?: boolean;
}

const BUILTIN_PRESETS: FilterPreset[] = [
  { id: "sure-shots", name: "Sure Shots", builtin: true, sector: "", category: "S", minAdv: 5_000_000, requireRs52w: false, limit: 50, minMomentum: 20 },
  { id: "action-setups", name: "Action Setups", builtin: true, sector: "", category: "A", minAdv: 5_000_000, requireRs52w: false, limit: 50, minMomentum: 15 },
  { id: "rs-leaders", name: "RS Leaders", builtin: true, sector: "", category: "", minAdv: 10_000_000, requireRs52w: true, limit: 50, minMomentum: 20 },
];

const PRESETS_KEY = "alphastream-filter-presets";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "S", label: "S — Sure Shot" },
  { value: "A", label: "A — Action" },
  { value: "B", label: "B — Bounce" },
  { value: "X", label: "X — Anomaly" },
  { value: "2", label: "2 — Stage 2" },
  { value: "1", label: "1 — Stage 1" },
];

const LIMIT_OPTIONS = [25, 50, 100, 200];

type SortKey = "rank" | "rs_composite" | "flow_score" | "momentum_score";
type SortDir = "asc" | "desc";

export default function FilterPage() {
  const [sector, setSector] = useState("");
  const [category, setCategory] = useState("");
  const [minAdv, setMinAdv] = useState(5_000_000);
  const [minAdvInput, setMinAdvInput] = useState("5000000");
  const [requireRs52w, setRequireRs52w] = useState(false);
  const [limit, setLimit] = useState(50);
  const [minMomentum, setMinMomentum] = useState(15);
  const [minMomentumInput, setMinMomentumInput] = useState("15");

  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [jobRunning, setJobRunning] = useState(false);
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      if (stored) setCustomPresets(JSON.parse(stored));
    } catch {}
  }, []);

  const params: FilterParams = useMemo(
    () => ({
      limit,
      sector: sector || undefined,
      min_adv: minAdv,
      category: category || undefined,
      require_rs_52w_high: requireRs52w || undefined,
      min_momentum_score: minMomentum,
    }),
    [limit, sector, category, minAdv, requireRs52w, minMomentum]
  );

  const { data, isLoading, isError, isFetching, refetch } = useFilterSetup(params);

  const sectorOptions = Object.entries(SECTOR_ETF_NAMES);

  const sorted = useMemo(() => {
    if (!data?.results) return [];
    return [...data.results].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank":           cmp = a.rank - b.rank; break;
        case "rs_composite":   cmp = a.rs_composite - b.rs_composite; break;
        case "flow_score":     cmp = a.flow_score - b.flow_score; break;
        case "momentum_score": cmp = a.momentum_score - b.momentum_score; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "rank" ? "asc" : "desc"); }
  }

  function handleMinAdvBlur() {
    const val = parseInt(minAdvInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(val) && val >= 0) { setMinAdv(val); setActivePresetId(null); }
    else setMinAdvInput(String(minAdv));
  }

  function handleMinMomentumBlur() {
    const val = parseInt(minMomentumInput, 10);
    if (!isNaN(val) && val >= 0 && val <= 40) { setMinMomentum(val); setActivePresetId(null); }
    else setMinMomentumInput(String(minMomentum));
  }

  function applyPreset(preset: FilterPreset) {
    setSector(preset.sector);
    setCategory(preset.category);
    setMinAdv(preset.minAdv);
    setMinAdvInput(String(preset.minAdv));
    setRequireRs52w(preset.requireRs52w);
    setLimit(preset.limit);
    setMinMomentum(preset.minMomentum);
    setMinMomentumInput(String(preset.minMomentum));
    setActivePresetId(preset.id);
  }

  function saveCurrentAsPreset() {
    const name = prompt("Preset name:");
    if (!name?.trim()) return;
    const preset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      sector,
      category,
      minAdv,
      requireRs52w,
      limit,
      minMomentum,
    };
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(updated)); } catch {}
    setActivePresetId(preset.id);
  }

  function deleteCustomPreset(id: string) {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(updated)); } catch {}
    if (activePresetId === id) setActivePresetId(null);
  }

  async function handleRunJob() {
    setJobRunning(true);
    try {
      await api.triggerFilterJob(params);
      setTimeout(() => refetch(), 3000);
    } finally {
      setJobRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Setup Filter</h1>
            {data?.as_of && (
              <p className="text-sm text-[var(--text-muted)]">As of {data.as_of}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRunJob}
          disabled={jobRunning}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 transition-colors shrink-0"
        >
          <Play className="h-3.5 w-3.5" />
          {jobRunning ? "Running…" : "Run Filter Job"}
        </button>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[...BUILTIN_PRESETS, ...customPresets].map((preset) => (
          <div key={preset.id} className="relative group flex items-center">
            <button
              onClick={() => applyPreset(preset)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                activePresetId === preset.id
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/40"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30",
                !preset.builtin && "pr-6"
              )}
            >
              {preset.name}
            </button>
            {!preset.builtin && (
              <button
                onClick={() => deleteCustomPreset(preset.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove preset"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={saveCurrentAsPreset}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-colors"
        >
          <Bookmark className="h-3 w-3" />
          Save
        </button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        {/* Sector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-muted)]">Sector</label>
          <select
            value={sector}
            onChange={(e) => { setSector(e.target.value); setActivePresetId(null); }}
            className="h-8 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="">All Sectors</option>
            {sectorOptions.map(([etf, name]) => (
              <option key={etf} value={etf}>{etf} — {name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-muted)]">Category</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setActivePresetId(null); }}
            className="h-8 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Min ADV */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-muted)]">Min ADV ($)</label>
          <input
            type="text"
            value={minAdvInput}
            onChange={(e) => setMinAdvInput(e.target.value)}
            onBlur={handleMinAdvBlur}
            className="h-8 w-32 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] tabular-nums"
          />
        </div>

        {/* Top N */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-muted)]">Top N</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-8 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Mom threshold */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-muted)]">
            Mom ≥{" "}
            <span className="text-[var(--text-primary)]">{minMomentum === 0 ? "off" : minMomentum}</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={40}
              step={5}
              value={minMomentumInput}
              onChange={(e) => setMinMomentumInput(e.target.value)}
              onBlur={handleMinMomentumBlur}
              className="h-8 w-16 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] tabular-nums"
            />
            {minMomentum > 0 && (
              <button
                onClick={() => { setMinMomentum(0); setMinMomentumInput("0"); }}
                className="h-8 px-2 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] bg-[var(--bg-primary)]"
                title="Disable Layer 4"
              >
                off
              </button>
            )}
          </div>
        </div>

        {/* RS 52wk */}
        <label className="flex items-center gap-2 cursor-pointer h-8 mb-0.5">
          <input
            type="checkbox"
            checked={requireRs52w}
            onChange={(e) => { setRequireRs52w(e.target.checked); setActivePresetId(null); }}
            className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)]"
          />
          <span className="text-sm text-[var(--text-primary)]">RS 52wk High</span>
        </label>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] ml-auto">
            <div className="w-3 h-3 rounded-full border border-[var(--accent)] border-t-transparent animate-spin" />
            Updating…
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-24 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          <div className="h-20 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          <div className="h-72 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-sm text-amber-400 mb-1">Filter data not available.</p>
          <p className="text-xs text-[var(--text-muted)]">
            Run the backend pipeline first, then click Run Filter Job or wait for scheduled data.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Funnel */}
          <FunnelSummary stats={data.funnel_stats} />

          {/* Sector context */}
          {data.sector_context.length > 0 && (
            <SectorContextStrip
              sectors={data.sector_context}
              selectedSector={sector}
              onSelectSector={(etf) => setSector(etf)}
            />
          )}

          {/* Inflow / Outflow tags */}
          {data.funnel_stats.inflow_sectors.length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">Inflow:</span>
                {data.funnel_stats.inflow_sectors.map((etf) => (
                  <span key={etf} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                    {etf}
                  </span>
                ))}
              </div>
              {data.funnel_stats.outflow_sectors.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">Outflow:</span>
                  {data.funnel_stats.outflow_sectors.map((etf) => (
                    <span key={etf} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500/70 font-medium">
                      {etf}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {sorted.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No results match the current filters.</p>
              <p className="text-xs text-[var(--text-muted)]">
                Try a preset above, relax the momentum threshold, or{" "}
                <button onClick={handleRunJob} disabled={jobRunning} className="text-[var(--accent)] hover:underline">
                  re-run the filter job →
                </button>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
                    <Th onClick={() => toggleSort("rank")}>#</Th>
                    <Th>Ticker</Th>
                    <Th>Sector</Th>
                    <Th onClick={() => toggleSort("rs_composite")} right>RS</Th>
                    <Th onClick={() => toggleSort("flow_score")} right>Flow</Th>
                    <Th center>SMA</Th>
                    <Th center>High</Th>
                    <Th onClick={() => toggleSort("momentum_score")} right>Mom</Th>
                    <Th>RSI</Th>
                    <Th>Category</Th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <ResultRow key={r.ticker} result={r} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            {sorted.length} result{sorted.length !== 1 ? "s" : ""} ·{" "}
            {data.funnel_stats.universe_count.toLocaleString()} → L1: {data.funnel_stats.after_layer1.toLocaleString()} → L2: {data.funnel_stats.after_layer2.toLocaleString()} → L3: {data.funnel_stats.after_layer3.toLocaleString()} → L4: {data.funnel_stats.after_layer4.toLocaleString()} → shown: {data.funnel_stats.returned.toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Th({
  children,
  onClick,
  right,
  center,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  right?: boolean;
  center?: boolean;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "px-3 py-2.5 font-medium text-[var(--text-muted)] whitespace-nowrap",
        onClick && "cursor-pointer hover:text-[var(--text-primary)]",
        right ? "text-right" : center ? "text-center" : "text-left"
      )}
    >
      {onClick ? (
        <span className={cn("inline-flex items-center gap-1", right && "justify-end")}>
          {children}
          <ArrowUpDown className="h-3 w-3" />
        </span>
      ) : (
        children
      )}
    </th>
  );
}

function ResultRow({ result: r }: { result: FilterResult }) {
  const cat = parseCategory(r.category);

  return (
    <tr className="border-t border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
      {/* Rank */}
      <td className="px-3 py-2.5 text-[var(--text-muted)] tabular-nums font-medium">{r.rank}</td>

      {/* Ticker */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/ticker/${r.ticker}`}
            className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            {r.ticker}
          </Link>
          {r.rs_52w_high && (
            <span className="px-1 py-0.5 text-[9px] font-medium rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              RS52W
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)] truncate max-w-[130px]">{r.industry}</p>
      </td>

      {/* Sector ETF */}
      <td className="px-3 py-2.5">
        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          {r.sector_etf}
        </span>
      </td>

      {/* RS Composite */}
      <td className="px-3 py-2.5 text-right">
        <span
          className={cn(
            "tabular-nums font-semibold",
            r.rs_composite > 75 ? "text-emerald-500" : "text-[var(--text-primary)]"
          )}
        >
          {r.rs_composite.toFixed(1)}
        </span>
      </td>

      {/* Flow score */}
      <td className="px-3 py-2.5 text-right">
        <span
          className={cn(
            "tabular-nums font-medium",
            r.flow_score >= 70 ? "text-emerald-500" : r.flow_score >= 40 ? "text-[var(--text-primary)]" : "text-red-500"
          )}
        >
          {r.flow_score}
        </span>
      </td>

      {/* SMA200 rising — always ^ for results */}
      <td className="px-3 py-2.5 text-center text-emerald-500 font-medium">↑</td>

      {/* Near 20d high */}
      <td className="px-3 py-2.5 text-center">
        {r.near_20d_high ? (
          <span title={r.at_20d_high ? "At 20d high" : "Near 20d high"}>
            <CheckCircle2
              className={cn(
                "h-4 w-4 mx-auto",
                r.at_20d_high ? "text-emerald-400" : "text-emerald-600/60"
              )}
            />
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        )}
      </td>

      {/* Mom score */}
      <td className="px-3 py-2.5 text-right">
        <span className="tabular-nums font-medium text-[var(--text-primary)]">
          {r.momentum_score}
        </span>
        {r.consolidation_break && (
          <span className="mt-0.5 block text-[9px] font-medium text-amber-400 text-right">BREAK</span>
        )}
      </td>

      {/* RSI regime badge */}
      <td className="px-3 py-2.5">
        <MomentumBadge regime={r.rsi_regime} score={r.momentum_score} />
      </td>

      {/* Category */}
      <td className="px-3 py-2.5">
        <StageBadge category={cat} />
      </td>
    </tr>
  );
}
