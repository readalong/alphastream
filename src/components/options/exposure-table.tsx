"use client";

/**
 * Strike x expiry exposure table — the numeric view of the dealer-flow
 * snapshot (GET /api/dealer-flow/{ticker}, engine app/dealer_flow.py).
 *
 * One row per strike near spot, one column per expiry plus an "All" total,
 * each cell the dealer exposure in that bucket. Laid out like the AION
 * reference table: each column is read against its own largest cell (a
 * same-week expiry dwarfs a monthly one), a top-decile cell gets a bar
 * (its share of the column max, blue positive / red negative) and full
 * ink, the rest are muted, and the column's largest gets a star. Every cell
 * prints its signed value, so colour never carries the sign alone. The
 * next five expiries show by default; the optional "All" total sums every
 * expiry.
 *
 * GEX, VEX, CEX and OI sit side by side (desktop only, as AION does) in one
 * scroll area, so a strike reads across all four on one row: every table is
 * built from the same strikes, so the rows (and the spot line) align.
 */

import { useMemo, useState } from "react";
import { useDealerFlow } from "@/hooks/use-gex";
import { isNotFound } from "@/components/desk/primitives";
import { GlossaryLink } from "@/components/glossary-link";
import { cn } from "@/lib/utils";
import {
  buildExposureTable,
  cellStyle,
  type ColumnStat,
  fmtCompact,
  fmtExpiry,
  fmtFull,
  type ExposureMetric,
  type ExposureRow,
  type ExposureTableData,
} from "@/lib/exposure-table";

const METRICS: {
  key: ExposureMetric;
  label: string;
  glossary?: string;
  unit: string;
  /** Unit as the four-across heading shows it (the full unit is in the caption). */
  short: string;
  pos: string;
  neg: string;
}[] = [
  {
    key: "gex",
    label: "GEX",
    glossary: "GEX (gamma exposure)",
    unit: "dollars of dealer gamma per 1% move in the underlying",
    short: "$ gamma per 1% move",
    pos: "dealers long gamma: their hedging leans against moves",
    neg: "dealers short gamma: their hedging adds to moves",
  },
  {
    key: "vex",
    label: "VEX",
    glossary: "VEX",
    unit: "dollars of dealer delta change per 1 point of implied volatility",
    short: "$ delta per 1 IV point",
    // app/dealer_flow.vanna_regime: positive net VEX = an IV decline forces dealers to buy.
    pos: "if implied vol falls, dealers buy",
    neg: "if implied vol falls, dealers sell",
  },
  {
    key: "cex",
    label: "CEX",
    glossary: "CEX",
    unit: "dollars of dealer delta change per calendar day (charm)",
    short: "$ delta per day",
    // CEX = dealer sign x charm (dDelta/dt as calendar time passes): positive means
    // dealer delta rises each day, so the hedge is to sell; negative, to buy.
    pos: "as a day passes, dealers' hedge sells",
    neg: "as a day passes, dealers' hedge buys",
  },
  {
    key: "oi",
    label: "OI",
    glossary: "Open interest",
    unit: "open contracts, calls plus puts",
    short: "contracts",
    pos: "more open contracts",
    neg: "",
  },
];

const RANGES = [2, 3, 4, 5, 10] as const;
const NEXT_EXPIRIES = 5;

function Swatch({ v }: { v: number }) {
  const one: ColumnStat = { max: 1, top: 0, star: null };
  return (
    <span
      className="inline-block h-2.5 w-5 shrink-0 border border-[var(--border)]"
      style={{ background: cellStyle(v * 0.7, one).bar }}
    />
  );
}

function MetricHeading({ metric }: { metric: (typeof METRICS)[number] }) {
  return (
    // Fixed height: the four tables must start on the same line so their
    // rows (one strike each) stay aligned across all four.
    <div className="h-14 space-y-0.5 overflow-hidden pb-2" title={`${metric.label}: ${metric.unit}`}>
      <p className="text-xs font-semibold text-[var(--text-primary)]">
        {metric.glossary ? (
          <GlossaryLink term={metric.glossary} className="hover:text-[var(--accent)]">
            {metric.label}
          </GlossaryLink>
        ) : (
          metric.label
        )}
        <span className="ml-1.5 font-normal text-[var(--text-muted)]">{metric.short}</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
        {metric.neg && (
          <span className="flex items-center gap-1">
            <Swatch v={-1} /> {metric.neg}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Swatch v={1} /> {metric.pos}
        </span>
      </p>
    </div>
  );
}

export function ExposureTable({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useDealerFlow(ticker);
  const [range, setRange] = useState<number>(4);
  const [allExpiries, setAllExpiries] = useState(false);
  const [showTotals, setShowTotals] = useState(false);

  const tables = useMemo(() => {
    if (!data) return null;
    const n = allExpiries ? Infinity : NEXT_EXPIRIES;
    const out: Partial<Record<ExposureMetric, ExposureTableData>> = {};
    for (const m of METRICS) {
      // An older snapshot has no OI matrix: its table says so instead.
      if (m.key === "oi" && !Array.isArray(data.oi)) continue;
      out[m.key] = buildExposureTable(data, m.key, range, n);
    }
    return out;
  }, [data, range, allExpiries]);

  if (isLoading) return <div className="h-64 rounded-lg bg-[var(--bg-card)]" />;
  if (error && !isNotFound(error)) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
        Could not load the {ticker} matrix: {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }
  if (!data || !tables) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
        No dealer-flow matrix for {ticker} today. Run{" "}
        <code className="font-mono text-[var(--text-primary)]">python main.py --dealer-flow</code> on the backend.
      </p>
    );
  }

  const gex = tables.gex!;
  const expiries = allExpiries ? data.expiries : data.expiries.slice(0, NEXT_EXPIRIES);
  const pulled = data.retrieved_at ? new Date(data.retrieved_at) : null;
  const flip = data.totals?.gamma_flip_strike;
  const sparse = data.quality?.sparse_expiries ?? [];

  const toggle = (on: boolean) =>
    cn(
      "border border-[var(--border)] px-2 py-0.5 text-xs",
      on
        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    );

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          Strike x expiry. Bar = share of that column&apos;s largest; cells below the column&apos;s top
          10% are dimmed; ★ = the column&apos;s largest. All relative to the strikes shown. Colour shows
          the sign of the number, not a bullish or bearish call.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            Strikes within
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className="border border-[var(--border)] bg-[var(--bg-card)] px-1 py-0.5 text-xs text-[var(--text-primary)]"
            >
              {RANGES.map((r) => (
                <option key={r} value={r}>
                  ±{r}%
                </option>
              ))}
            </select>
            of spot
          </label>
          {data.expiries.length > NEXT_EXPIRIES && (
            <button
              type="button"
              aria-pressed={allExpiries}
              onClick={() => setAllExpiries((x) => !x)}
              className={toggle(allExpiries)}
            >
              All {data.expiries.length} expiries
            </button>
          )}
          <button
            type="button"
            aria-pressed={showTotals}
            onClick={() => setShowTotals((x) => !x)}
            className={toggle(showTotals)}
          >
            Totals column
          </button>
        </div>
      </div>

      {gex.rows.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          No strikes within ±{range}% of spot in this snapshot: widen the range.
        </p>
      )}

      {flip != null && gex.rows.length > 0 && gex.flipStrike == null && (
        <p className="text-xs text-[var(--text-muted)]">
          Gamma flip {flip.toLocaleString("en-US")} is {flip > data.spot ? "above" : "below"} the
          strikes shown.
        </p>
      )}

      {sparse.length > 0 && (
        <p role="status" className="text-xs text-[var(--caution)]">
          Sparse expiry: {sparse.map(fmtExpiry).join(", ")} came back with under half the usual strikes
          near spot, so most of that column is missing, not zero.
        </p>
      )}

      <div className="max-h-[75vh] overflow-auto">
        <div className="flex w-max gap-4">
          {METRICS.map((m) => {
            const t = tables[m.key];
            return (
              <section key={m.key} aria-label={`${m.label} by strike and expiry`} className="w-max">
                <MetricHeading metric={m} />
                {t ? (
                  <MetricTable
                    ticker={ticker}
                    meta={m}
                    table={t}
                    expiries={expiries}
                    dtes={data.dtes}
                    spot={data.spot}
                    showTotals={showTotals}
                  />
                ) : (
                  <p className="w-48 text-xs text-[var(--text-muted)]">
                    This snapshot predates the OI matrix. Re-run --dealer-flow.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Snapshot {data.date}
        {pulled && `, pulled ${pulled.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`}.
        Open interest is the count published before that session (it updates overnight), so this is a
        pre-market positioning map. Same-day (0DTE) expiries are not in the matrix, and dealer side is
        assumed: long the calls customers sold, short the puts they bought.
      </p>
    </div>
  );
}

function MetricTable({
  ticker,
  meta,
  table,
  expiries,
  dtes,
  spot,
  showTotals,
}: {
  ticker: string;
  meta: (typeof METRICS)[number];
  table: ExposureTableData;
  expiries: string[];
  dtes: number[];
  spot: number;
  showTotals: boolean;
}) {
  const colCount = expiries.length + 1 + (showTotals ? 1 : 0);
  return (
    // leading-4 + h-5 rows: every row is exactly one height whatever its
    // glyphs (the star comes from a fallback font), so the tables align.
    <table className="w-max border-collapse border border-[var(--border)] text-[11px] leading-4 font-mono tabular-nums">
      <caption className="sr-only">
        {ticker} {meta.label} by strike and expiry, {meta.unit}
      </caption>
      <thead className="sticky top-0 z-20 bg-[var(--bg-card)]">
        <tr className="h-9 border-b border-[var(--border)] text-[var(--text-muted)]">
          <th scope="col" className="bg-[var(--bg-card)] px-1.5 py-1 text-left font-normal">
            Strike
          </th>
          {expiries.map((e, c) => (
            <th key={e} scope="col" className="bg-[var(--bg-card)] px-1.5 py-1 text-right font-normal whitespace-nowrap">
              <span className="block font-sans text-[var(--text-primary)]">{fmtExpiry(e)}</span>
              <span className="block">{dtes[c]}d</span>
            </th>
          ))}
          {showTotals && (
            <th scope="col" className="border-l border-[var(--border)] bg-[var(--bg-card)] px-1.5 py-1 text-right font-normal">
              <span className="block font-sans text-[var(--text-primary)]">All</span>
              <span className="block">≤{Math.max(...dtes)}d</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((r, i) => (
          <ExposureRowView
            key={r.strike}
            row={r}
            metric={meta.key}
            expiries={expiries}
            dtes={dtes}
            cols={table.cols}
            total={showTotals ? table.total : null}
            spotLine={i === table.spotBefore ? spot : null}
            colCount={colCount}
            flip={r.strike === table.flipStrike}
          />
        ))}
        {table.spotBefore === table.rows.length && <SpotLine spot={spot} colCount={colCount} />}
      </tbody>
    </table>
  );
}

function SpotLine({ spot, colCount }: { spot: number; colCount: number }) {
  return (
    <tr className="h-5" aria-label={`spot ${spot}`}>
      <td
        colSpan={colCount}
        className="border-y-2 border-[var(--accent)] px-1.5 py-0.5 text-left font-semibold text-[var(--accent)]"
      >
        spot {spot.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </td>
    </tr>
  );
}

function ExposureRowView({
  row,
  metric,
  expiries,
  dtes,
  cols,
  total,
  spotLine,
  colCount,
  flip,
}: {
  row: ExposureRow;
  metric: ExposureMetric;
  expiries: string[];
  dtes: number[];
  cols: ColumnStat[];
  total: ColumnStat | null;
  spotLine: number | null;
  colCount: number;
  flip: boolean;
}) {
  return (
    <>
      {spotLine != null && <SpotLine spot={spotLine} colCount={colCount} />}
      <tr className="h-5 border-b border-[var(--border)]/40">
        <th
          scope="row"
          className="px-1.5 py-0.5 text-left font-semibold text-[var(--text-primary)] whitespace-nowrap"
        >
          {row.strike.toLocaleString("en-US")}
          {flip && (
            <span className="ml-1 font-sans text-[10px] font-normal text-[var(--text-muted)]" title="Nearest strike to the gamma flip">
              flip
            </span>
          )}
        </th>
        {row.cells.map((v, c) => (
          <Cell
            key={expiries[c]}
            v={v}
            col={cols[c]}
            metric={metric}
            title={`${row.strike} · ${expiries[c]} (${dtes[c]}d) · ${fmtFull(v, metric)}`}
          />
        ))}
        {total && (
          <Cell
            v={row.total}
            col={total}
            metric={metric}
            title={`${row.strike} · all expiries · ${fmtFull(row.total, metric)}`}
            className="border-l border-[var(--border)]"
          />
        )}
      </tr>
    </>
  );
}

function Cell({
  v,
  col,
  metric,
  title,
  className,
}: {
  v: number;
  col: ColumnStat;
  metric: ExposureMetric;
  title: string;
  className?: string;
}) {
  const text = fmtCompact(v, metric);
  const { bar, strong } = cellStyle(v, col);
  // Every cell tied at the column's largest gets the star (ties do occur in OI).
  const star = col.max > 0 && Math.abs(v) === col.max && text !== "0";
  return (
    <td
      className={cn(
        "px-1.5 py-0.5 text-right whitespace-nowrap",
        strong ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-muted)]",
        className
      )}
      style={bar ? { background: bar } : undefined}
      title={star ? `${title} · the largest in this column` : title}
    >
      {text === "0" ? <span className="text-[var(--text-faint)]">·</span> : text}
      {star && (
        <>
          <span aria-hidden="true"> ★</span>
          <span className="sr-only">, largest in column</span>
        </>
      )}
    </td>
  );
}
