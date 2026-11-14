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
 * next five expiries show by default; the "All" total sums every expiry.
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
} from "@/lib/exposure-table";

const METRICS: {
  key: ExposureMetric;
  label: string;
  glossary?: string;
  unit: string;
  pos: string;
  neg: string;
}[] = [
  {
    key: "gex",
    label: "GEX",
    glossary: "GEX (gamma exposure)",
    unit: "dollars of dealer gamma per 1% move in the underlying",
    pos: "dealers long gamma: their hedging leans against moves",
    neg: "dealers short gamma: their hedging adds to moves",
  },
  {
    key: "vex",
    label: "VEX",
    glossary: "VEX",
    unit: "dollars of dealer delta change per 1 point of implied volatility",
    // app/dealer_flow.vanna_regime: positive net VEX = an IV decline forces dealers to buy.
    pos: "if implied vol falls, dealers buy",
    neg: "if implied vol falls, dealers sell",
  },
  {
    key: "cex",
    label: "CEX",
    glossary: "CEX",
    unit: "dollars of dealer delta change per calendar day (charm)",
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
    pos: "more open contracts",
    neg: "",
  },
];

const RANGES = [2, 3, 4, 5, 10] as const;
const NEXT_EXPIRIES = 5;

function Legend({ metric }: { metric: (typeof METRICS)[number] }) {
  const one: ColumnStat = { max: 1, top: 0, star: null };
  const sw = (v: number) => ({ background: cellStyle(v * 0.7, one).bar });
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
      {metric.neg && (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 border border-[var(--border)]" style={sw(-1)} />
          negative: {metric.neg}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-6 border border-[var(--border)]" style={sw(1)} />
        {metric.key === "oi" ? metric.pos : `positive: ${metric.pos}`}
      </span>
      <span>
        Bar = share of that column&apos;s largest; cells below the column&apos;s top 10% are dimmed;
        ★ = the column&apos;s largest. Colour shows the sign of the number, not a bullish or bearish call.
      </span>
    </div>
  );
}

export function ExposureTable({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useDealerFlow(ticker);
  const [metric, setMetric] = useState<ExposureMetric>("gex");
  const [range, setRange] = useState<number>(4);
  const [allExpiries, setAllExpiries] = useState(false);

  // An older snapshot has no OI matrix: its OI toggle is disabled, and a
  // stale "oi" choice falls back to GEX instead of a dead end.
  const shown: ExposureMetric = metric === "oi" && data && !Array.isArray(data.oi) ? "gex" : metric;
  const table = useMemo(
    () => (data ? buildExposureTable(data, shown, range, allExpiries ? Infinity : NEXT_EXPIRIES) : null),
    [data, shown, range, allExpiries]
  );

  if (isLoading) return <div className="h-64 rounded-lg bg-[var(--bg-card)]" />;
  if (error && !isNotFound(error)) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
        Could not load the {ticker} matrix: {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }
  if (!data || !table) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
        No dealer-flow matrix for {ticker} today. Run{" "}
        <code className="font-mono text-[var(--text-primary)]">python main.py --dealer-flow</code> on the backend.
      </p>
    );
  }
  const hasOi = Array.isArray(data.oi);
  const meta = METRICS.find((x) => x.key === shown)!;

  const pulled = data.retrieved_at ? new Date(data.retrieved_at) : null;
  const expiries = allExpiries ? data.expiries : data.expiries.slice(0, NEXT_EXPIRIES);
  const colCount = expiries.length + 2;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          Strike x expiry —{" "}
          {meta.glossary ? (
            <GlossaryLink term={meta.glossary} className="hover:text-[var(--accent)]">
              {meta.label}
            </GlossaryLink>
          ) : (
            meta.label
          )}
          : {meta.unit}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Exposure metric" className="flex border border-[var(--border)]">
            {METRICS.map((x) => (
              <button
                key={x.key}
                type="button"
                aria-pressed={shown === x.key}
                disabled={x.key === "oi" && !hasOi}
                title={x.key === "oi" && !hasOi ? "This snapshot predates the OI matrix" : undefined}
                onClick={() => setMetric(x.key)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed",
                  shown === x.key
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {x.label}
              </button>
            ))}
          </div>
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
              className="border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {allExpiries ? `Next ${NEXT_EXPIRIES} expiries` : `All ${data.expiries.length} expiries`}
            </button>
          )}
        </div>
      </div>

      <Legend metric={meta} />

      {table.rows.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          No strikes within ±{range}% of spot in this snapshot: widen the range.
        </p>
      )}

      {data.totals?.gamma_flip_strike != null && table.rows.length > 0 && table.flipStrike == null && (
        <p className="text-xs text-[var(--text-muted)]">
          Gamma flip {data.totals.gamma_flip_strike.toLocaleString("en-US")} is{" "}
          {data.totals.gamma_flip_strike > data.spot ? "above" : "below"} the strikes shown.
        </p>
      )}

      <div className="max-h-[32rem] overflow-auto border border-[var(--border)]">
        <table className="w-max min-w-full border-collapse text-xs font-mono tabular-nums">
          <caption className="sr-only">
            {ticker} {meta.label} by strike and expiry, {meta.unit}
          </caption>
          <thead className="sticky top-0 z-20 bg-[var(--bg-card)]">
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th scope="col" className="sticky left-0 z-30 bg-[var(--bg-card)] px-2 py-1.5 text-left font-normal">
                Strike
              </th>
              {expiries.map((e, c) => (
                <th key={e} scope="col" className="px-2 py-1.5 text-right font-normal whitespace-nowrap">
                  <span className="block font-sans text-[var(--text-primary)]">{fmtExpiry(e)}</span>
                  <span className="block">{data.dtes[c]}d</span>
                </th>
              ))}
              <th scope="col" className="border-l border-[var(--border)] px-2 py-1.5 text-right font-normal">
                <span className="block font-sans text-[var(--text-primary)]">All</span>
                <span className="block">≤{Math.max(...data.dtes)}d</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <ExposureRowView
                key={r.strike}
                row={r}
                metric={shown}
                expiries={expiries}
                dtes={data.dtes}
                cols={table.cols}
                total={table.total}
                spotLine={i === table.spotBefore ? data.spot : null}
                colCount={colCount}
                flip={r.strike === table.flipStrike}
              />
            ))}
            {table.spotBefore === table.rows.length && (
              <SpotLine spot={data.spot} colCount={colCount} />
            )}
          </tbody>
        </table>
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

function SpotLine({ spot, colCount }: { spot: number; colCount: number }) {
  return (
    <tr aria-label={`spot ${spot}`}>
      <td colSpan={colCount} className="p-0">
        <div className="sticky left-0 flex w-max items-center gap-2 border-y-2 border-[var(--accent)] px-2 py-0.5 text-[var(--accent)] font-semibold">
          spot {spot.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </div>
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
  total: ColumnStat;
  spotLine: number | null;
  colCount: number;
  flip: boolean;
}) {
  return (
    <>
      {spotLine != null && <SpotLine spot={spotLine} colCount={colCount} />}
      <tr className="border-b border-[var(--border)]/40">
        <th
          scope="row"
          className="sticky left-0 z-10 bg-[var(--bg-card)] px-2 py-1 text-left font-semibold text-[var(--text-primary)] whitespace-nowrap"
        >
          {row.strike.toLocaleString("en-US")}
          {flip && (
            <span className="ml-1.5 font-sans text-[10px] font-normal text-[var(--text-muted)]" title="Nearest strike to the gamma flip">
              flip
            </span>
          )}
        </th>
        {row.cells.map((v, c) => (
          <Cell
            key={expiries[c]}
            v={v}
            col={cols[c]}
            strike={row.strike}
            metric={metric}
            title={`${row.strike} · ${expiries[c]} (${dtes[c]}d) · ${fmtFull(v, metric)}`}
          />
        ))}
        <Cell
          v={row.total}
          col={total}
          strike={row.strike}
          metric={metric}
          title={`${row.strike} · all expiries · ${fmtFull(row.total, metric)}`}
          className="border-l border-[var(--border)]"
        />
      </tr>
    </>
  );
}

function Cell({
  v,
  col,
  strike,
  metric,
  title,
  className,
}: {
  v: number;
  col: ColumnStat;
  strike: number;
  metric: ExposureMetric;
  title: string;
  className?: string;
}) {
  const text = fmtCompact(v, metric);
  const { bar, strong } = cellStyle(v, col);
  const star = col.star === strike && text !== "0";
  return (
    <td
      className={cn(
        "px-2 py-1 text-right whitespace-nowrap",
        strong ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-muted)]",
        className
      )}
      style={bar ? { background: bar } : undefined}
      title={star ? `${title} · the largest in this column` : title}
    >
      {text === "0" ? <span className="text-[var(--text-faint)]">·</span> : text}
      {star && <span aria-label="largest in column"> ★</span>}
    </td>
  );
}
