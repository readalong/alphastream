"use client";

/**
 * /opportunities — sector rotation + long/short opportunity scans
 * (docs/ALPHASTREAM_OPPORTUNITIES_UI.md, which calls this feature "Alpha
 * Stream" — renamed in the UI/nav since that reads as the app's own name,
 * AlphaStream). One backend call (/api/opportunities/both) returns the
 * sector-rotation pass once plus both long and short candidate lists
 * already in memory — Long/Short is a client-side filter here, never a
 * refetch (§3 of the spec).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useOpportunities } from "@/hooks/use-opportunities";
import { cn, formatPrice } from "@/lib/utils";
import type {
  OpportunitiesUniverse,
  OpportunityCandidate,
  OpportunitySectorFocusRow,
  OpportunitySectorRow,
  OpportunitySide,
  OpportunitySideResponse,
} from "@/lib/types";

const UNIVERSE_OPTIONS: { value: OpportunitiesUniverse; label: string }[] = [
  { value: "sp500", label: "S&P 500" },
  { value: "nasdaq100", label: "Nasdaq 100" },
  { value: "full", label: "Full universe" },
  { value: "smoke", label: "Smoke test (20)" },
];

const UNIVERSE_SCAN_LABEL: Record<OpportunitiesUniverse, string> = {
  sp500: "~500 tickers",
  nasdaq100: "~100 tickers",
  full: "several thousand tickers",
  smoke: "20 tickers",
};

const SIDE_STORAGE_KEY = "alphastream-opportunities-side";

const SECTOR_STATE_COLOR: Record<string, string> = {
  inflow: "text-[var(--long)]",
  outflow: "text-[var(--short)]",
  neutral: "text-[var(--text-muted)]",
};

function fmtDollar(v: number) {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/* ── Sector rotation strip — shared context above the Long/Short toggle;
   doesn't change when the toggle changes (§4). ── */

function SectorChip({
  row,
  selected,
  onSelect,
}: {
  row: OpportunitySectorFocusRow;
  selected: boolean;
  onSelect: (etf: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(row.etf)}
      title={row.summary}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border transition-colors",
        selected
          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
          : "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]/40"
      )}
    >
      <span className="font-semibold">{row.etf}</span>
      <span className="text-[var(--text-muted)] tabular-nums">
        {row.score != null ? row.score.toFixed(0) : "—"}
      </span>
    </button>
  );
}

function SectorRotationStrip({
  inflow,
  outflow,
  fullRanking,
  sectorFilter,
  onSelectSector,
}: {
  inflow: OpportunitySectorFocusRow[];
  outflow: OpportunitySectorFocusRow[];
  fullRanking: OpportunitySectorRow[];
  sectorFilter: string | null;
  onSelectSector: (etf: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2.5">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
        Sector rotation
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] w-36 shrink-0">Money flowing INTO</span>
        <div className="flex flex-wrap gap-1.5">
          {inflow.map((r) => (
            <SectorChip key={r.etf} row={r} selected={sectorFilter === r.etf} onSelect={onSelectSector} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] w-36 shrink-0">Money flowing OUT OF</span>
        <div className="flex flex-wrap gap-1.5">
          {outflow.map((r) => (
            <SectorChip key={r.etf} row={r} selected={sectorFilter === r.etf} onSelect={onSelectSector} />
          ))}
        </div>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
      >
        {expanded ? "Hide full ranking" : "See full ranking"}
        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono border-t border-[var(--border)] pt-2">
          {fullRanking.map((r, i) => (
            <li key={r.etf}>
              <button
                onClick={() => onSelectSector(r.etf)}
                className={cn(
                  "flex items-center justify-between gap-2 w-full text-left rounded px-1 -mx-1 hover:bg-[var(--bg-primary)]",
                  sectorFilter === r.etf ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                )}
              >
                <span>
                  {i + 1}. {r.etf} <span className="opacity-70">{r.name}</span>
                </span>
                <span className="tabular-nums text-[var(--text-primary)]">
                  {r.score != null ? r.score.toFixed(0) : "—"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ── Candidate row — 4 visual lines, ruled not carded (§3 row anatomy). ── */

function WhyList({ why }: { why: string }) {
  const segments = why.split("|").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;
  return (
    <p className="text-sm text-[var(--text-muted)]">
      {segments.map((seg, i) => {
        const isCaution = seg.startsWith("CAUTION:");
        return (
          <span key={i}>
            <span className={isCaution ? "text-[var(--caution)] font-medium" : undefined}>{seg}</span>
            {i < segments.length - 1 && <span> · </span>}
          </span>
        );
      })}
    </p>
  );
}

// entry_note renders verbatim always (§5) — never paraphrased. The tag
// only adds a color/glyph cue for the two long-side pivot states; short
// entries and null (screener-only/pullback-only candidates) render plain.
function EntryNoteTag({ note }: { note: string | null }) {
  if (!note) return null;
  const crossed = note.includes("already crossed");
  const notYet = note.includes("NOT yet through");
  return (
    <span
      className={cn(
        "text-xs text-right",
        crossed ? "text-[var(--long)]" : notYet ? "text-[var(--caution)] font-medium" : "text-[var(--text-muted)]"
      )}
    >
      {crossed && "✓ "}
      {notYet && "⧗ "}
      {note}
    </span>
  );
}

function CandidateRow({ c }: { c: OpportunityCandidate }) {
  const { plan } = c;
  return (
    <div className="py-3 border-b border-[var(--border)] last:border-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`/ticker/${c.ticker}`}
            className="font-mono font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
          >
            {c.ticker}
          </Link>
          <span className="font-mono tabular-nums text-sm text-[var(--text-primary)]">
            {formatPrice(c.close)}
          </span>
          {c.sector_etf && (
            <span className={cn("text-xs", SECTOR_STATE_COLOR[c.sector_state] ?? "text-[var(--text-muted)]")}>
              {c.sector_etf} · {c.sector_state}
            </span>
          )}
        </div>
        <span className="text-sm font-mono tabular-nums text-[var(--text-primary)] shrink-0">
          conviction {c.conviction.toFixed(0)}
        </span>
      </div>

      <WhyList why={c.why} />

      <p className="text-sm font-mono tabular-nums text-[var(--text-primary)]">
        entry {formatPrice(plan.entry)} · stop {formatPrice(plan.stop)}
        {plan.target_1 != null && <> · T1 {formatPrice(plan.target_1)}</>}
        {" · "}
        {plan.shares} sh ({fmtDollar(plan.position_value)} · {plan.position_pct_of_portfolio.toFixed(1)}%)
      </p>

      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span className="text-xs text-[var(--text-muted)]">{plan.sizing_note}</span>
        <EntryNoteTag note={plan.entry_note} />
      </div>
    </div>
  );
}

function SideList({
  data,
  minConviction,
  sectorFilter,
}: {
  data: OpportunitySideResponse;
  minConviction: number;
  sectorFilter: string | null;
}) {
  if (data.candidates.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">No qualifying setups today.</p>
      </div>
    );
  }

  const candidates = data.candidates.filter(
    (c) => c.conviction >= minConviction && (!sectorFilter || c.sector_etf === sectorFilter)
  );

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">No candidates match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4">
      {candidates.map((c) => (
        <CandidateRow key={c.ticker} c={c} />
      ))}
    </div>
  );
}

/* ── Honesty footer — required, always visible, never dismissed (§6). ── */

function HonestyFooter() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        Discovery surface, not a validated trading system for most setups. Pivot-cross entries are the
        one configuration with a backtested edge (net R +0.12, 95% CI [+0.05, +0.19] on sp500 2016–2026).
        Screener-only and short-side setups are unproven — treat them as ideas to research, not signals
        to act on mechanically.
      </span>
      <Link
        href="/track-record"
        className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline shrink-0"
      >
        Read the evidence <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ── Page ── */

export default function AlphaStreamPage() {
  const [universe, setUniverse] = useState<OpportunitiesUniverse>("sp500");
  const [side, setSide] = useState<OpportunitySide>("long");
  const [minConviction, setMinConviction] = useState(0);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  // Default to whichever side the user last viewed (§3), not always "long".
  useEffect(() => {
    const stored = localStorage.getItem(SIDE_STORAGE_KEY);
    if (stored === "long" || stored === "short") setSide(stored);
  }, []);
  useEffect(() => {
    localStorage.setItem(SIDE_STORAGE_KEY, side);
  }, [side]);

  const { data, isLoading, isRescanning, error, rescan } = useOpportunities(universe, 15);

  const sideData = data ? data[side] : null;
  const isStale = data ? data.date !== new Date().toISOString().slice(0, 10) : false;

  const handleSelectSector = (etf: string) => {
    setSectorFilter((prev) => (prev === etf ? null : etf));
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <header className="space-y-1">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Opportunities</h1>
          <div className="flex items-center gap-2">
            <select
              value={universe}
              onChange={(e) => setUniverse(e.target.value as OpportunitiesUniverse)}
              disabled={isLoading || isRescanning}
              className="text-sm rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-[var(--text-primary)] disabled:opacity-50"
            >
              {UNIVERSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => rescan()}
              disabled={isRescanning || isLoading}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRescanning && "animate-spin")} />
              {isRescanning ? "Rescanning…" : "Rescan"}
            </button>
          </div>
        </div>
        {data && (
          <p className="text-xs text-[var(--text-muted)]">
            {data.universe} · {sideData?.n_scanned ?? "—"} scanned · generated {data.date}
          </p>
        )}
      </header>

      {isStale && data && (
        <div className="rounded border border-[var(--caution)]/25 bg-[var(--caution)]/10 px-3 py-2 text-sm text-[var(--caution)] flex items-center justify-between gap-3 flex-wrap">
          <span>Showing {data.date}&apos;s scan — today&apos;s has not been generated yet.</span>
          <button onClick={() => rescan()} className="underline shrink-0 disabled:opacity-50" disabled={isRescanning}>
            Rescan
          </button>
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-10 flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--text-muted)]">
            Scanning {UNIVERSE_SCAN_LABEL[universe]}… this can take a few minutes on first load.
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-[var(--short)]/25 bg-[var(--short)]/5 p-6 flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-6 w-6 text-[var(--short)]" />
          <p className="text-sm text-[var(--text-primary)]">
            {error instanceof Error ? error.message : "Could not load opportunities."}
          </p>
        </div>
      )}

      {data && !isLoading && (
        <>
          <SectorRotationStrip
            inflow={data.long.sector_rotation.money_flowing_into ?? []}
            outflow={data.short.sector_rotation.money_flowing_out_of ?? []}
            fullRanking={data.sector_rotation_full}
            sectorFilter={sectorFilter}
            onSelectSector={handleSelectSector}
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 rounded-md border border-[var(--border)] p-0.5 w-fit">
              {(["long", "short"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={cn(
                    "text-sm px-3 py-1 rounded capitalize transition-colors",
                    side === s
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {sectorFilter && (
                <button
                  onClick={() => setSectorFilter(null)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Clear sector filter ({sectorFilter})
                </button>
              )}
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                Min conviction
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minConviction}
                  onChange={(e) => setMinConviction(Number(e.target.value))}
                  className="w-24 accent-[var(--accent)]"
                />
                <span className="font-mono tabular-nums w-6 text-right">{minConviction}</span>
              </label>
            </div>
          </div>

          {sideData && (
            <SideList data={sideData} minConviction={minConviction} sectorFilter={sectorFilter} />
          )}
        </>
      )}

      <HonestyFooter />
    </div>
  );
}
