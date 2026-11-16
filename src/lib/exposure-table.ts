/**
 * Pure helpers for the /options strike x expiry exposure table
 * (src/components/options/exposure-table.tsx). No React, no JSX, so they
 * can be checked on their own (checked against real snapshots, see PR #11).
 */

import type { DealerFlowSnapshot } from "@/lib/types";

export type ExposureMetric = "gex" | "vex" | "cex" | "oi";

/** Bar strength: light enough that full ink on top keeps >= 4.5:1. */
export const BAR_MIX = 45;

const UNITS: [number, string][] = [[1, ""], [1e3, "K"], [1e6, "M"], [1e9, "B"]];

/** Compact signed value: "−$80M", "14K", "$1.3B". Picks the unit from the
 *  ROUNDED value, so 999.6 is "$1.0K", not "$1000", and 9,999 is "$10K",
 *  not "$10.0K". Anything that rounds to zero is "0". */
export function fmtCompact(v: number, metric: ExposureMetric): string {
  if (!Number.isFinite(v) || Math.abs(v) < 0.5) return "0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  const pre = metric === "oi" ? "" : "$";
  for (let i = 0; i < UNITS.length; i++) {
    const [u, suffix] = UNITS[i];
    const x = abs / u;
    let t = u === 1 ? x.toFixed(0) : x.toFixed(1);
    if (Number(t) >= 10) t = x.toFixed(0);
    if (Number(t) < 1000 || i === UNITS.length - 1) return `${sign}${pre}${t}${suffix}`;
  }
  return `${sign}${pre}${abs.toFixed(0)}`;
}

export function fmtFull(v: number, metric: ExposureMetric): string {
  const n = Math.round(v).toLocaleString("en-US");
  return metric === "oi" ? `${n} contracts` : `$${n}`;
}

/** "2026-11-05" -> "Nov 5", without a timezone shift. */
export function fmtExpiry(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface ExposureRow {
  strike: number;
  cells: number[];
  total: number;
}

/** Per-column scale, AION style: each expiry is read against its own
 *  largest cell, since a same-week expiry dwarfs a monthly one. */
export interface ColumnStat {
  /** Largest |value| in the column, among the rows shown. */
  max: number;
  /** |value| at or above which a cell is in the column's top decile. */
  top: number;
  /** Strike of the column's largest |value| (the star), or null. */
  star: number | null;
}

export interface ExposureTableData {
  rows: ExposureRow[];
  /** Index of the first row below spot: the spot line is drawn above it. */
  spotBefore: number;
  /** Visible strike closest to the gamma flip, when the flip is in range. */
  flipStrike: number | null;
  /** One per expiry column shown. */
  cols: ColumnStat[];
  /** The "All" column (sum over every expiry in the snapshot). */
  total: ColumnStat;
}

/** Pure: the column statistics for one list of values (strike-aligned). */
export function columnStat(values: number[], strikes: number[]): ColumnStat {
  let max = 0;
  let star: number | null = null;
  const nonzero: number[] = [];
  values.forEach((v, i) => {
    const a = Math.abs(v);
    if (a > 0) nonzero.push(a);
    if (a > max) {
      max = a;
      star = strikes[i];
    }
  });
  nonzero.sort((x, y) => x - y);
  // Top decile of the non-zero cells; with fewer than 10 cells, the largest.
  const top = nonzero.length ? nonzero[Math.min(nonzero.length - 1, Math.floor(nonzero.length * 0.9))] : Infinity;
  return { max, top, star };
}

/** Pure: the visible slice of the snapshot for one metric, strike range
 *  and number of expiry columns (the "All" total always sums every expiry). */
export function buildExposureTable(
  snap: Pick<DealerFlowSnapshot, "strikes" | "spot" | "gex" | "vex" | "cex" | "oi" | "totals">,
  metric: ExposureMetric,
  rangePct: number,
  maxExpiries: number = Infinity
): ExposureTableData {
  const m = (snap[metric] ?? []) as number[][];
  const rows: ExposureRow[] = [];
  snap.strikes.forEach((k, i) => {
    if (Math.abs(k - snap.spot) / snap.spot > rangePct / 100) return;
    const all = (m[i] ?? []).map((v) => (Number.isFinite(v) ? v : 0));
    rows.push({ strike: k, cells: all.slice(0, maxExpiries), total: all.reduce((a, b) => a + b, 0) });
  });
  rows.sort((a, b) => b.strike - a.strike);
  const below = rows.findIndex((r) => r.strike < snap.spot);
  const flip = snap.totals?.gamma_flip_strike;
  let flipStrike: number | null = null;
  if (flip != null && rows.length && Math.abs(flip - snap.spot) / snap.spot <= rangePct / 100) {
    flipStrike = rows.reduce((best, r) =>
      Math.abs(r.strike - flip) < Math.abs(best.strike - flip) ? r : best
    ).strike;
  }
  const strikes = rows.map((r) => r.strike);
  const nCols = rows.reduce((n, r) => Math.max(n, r.cells.length), 0);
  const cols: ColumnStat[] = [];
  for (let c = 0; c < nCols; c++) cols.push(columnStat(rows.map((r) => r.cells[c] ?? 0), strikes));
  return {
    rows,
    spotBefore: below === -1 ? rows.length : below,
    flipStrike,
    cols,
    total: columnStat(rows.map((r) => r.total), strikes),
  };
}

/** Pure: how a cell is drawn. A top-decile cell gets a bar (its share of the
 *  column's largest, blue positive / red negative) and full ink; the rest
 *  are muted with no bar, so the walls read first. */
export function cellStyle(v: number, col: ColumnStat): { bar?: string; strong: boolean } {
  const a = Math.abs(v);
  if (!col.max || !a || a < col.top) return { strong: false };
  const w = Math.max(4, Math.round((a / col.max) * 100));
  const c = `color-mix(in srgb, var(${v > 0 ? "--heat-pos" : "--heat-neg"}) ${BAR_MIX}%, var(--bg-card))`;
  return { bar: `linear-gradient(to right, ${c} ${w}%, transparent ${w}%)`, strong: true };
}
