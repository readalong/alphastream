/**
 * Pure helpers for the /options strike x expiry exposure table
 * (src/components/options/exposure-table.tsx). No React, no JSX, so they
 * can be checked on their own (scripts/check-exposure-table.ts).
 */

import type { DealerFlowSnapshot } from "@/lib/types";

export type ExposureMetric = "gex" | "vex" | "cex" | "oi";

export const MAX_MIX = 60;

export function fmtCompact(v: number, metric: ExposureMetric): string {
  if (!Number.isFinite(v) || v === 0) return "0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  const pre = metric === "oi" ? "" : "$";
  if (abs >= 1e9) return `${sign}${pre}${(abs / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  if (abs >= 1e6) return `${sign}${pre}${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `${sign}${pre}${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`;
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

export interface ExposureTableData {
  rows: ExposureRow[];
  /** Index of the first row below spot: the spot line is drawn above it. */
  spotBefore: number;
  /** Visible strike closest to the gamma flip, when the flip is in range. */
  flipStrike: number | null;
  maxCell: number;
  maxTotal: number;
}

/** Pure: the visible slice of the snapshot for one metric and range. */
export function buildExposureTable(
  snap: Pick<DealerFlowSnapshot, "strikes" | "spot" | "gex" | "vex" | "cex" | "oi" | "totals">,
  metric: ExposureMetric,
  rangePct: number
): ExposureTableData {
  const m = (snap[metric] ?? []) as number[][];
  const rows: ExposureRow[] = [];
  snap.strikes.forEach((k, i) => {
    if (Math.abs(k - snap.spot) / snap.spot > rangePct / 100) return;
    const cells = (m[i] ?? []).map((v) => (Number.isFinite(v) ? v : 0));
    rows.push({ strike: k, cells, total: cells.reduce((a, b) => a + b, 0) });
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
  return {
    rows,
    spotBefore: below === -1 ? rows.length : below,
    flipStrike,
    maxCell: Math.max(0, ...rows.flatMap((r) => r.cells.map(Math.abs))),
    maxTotal: Math.max(0, ...rows.map((r) => Math.abs(r.total))),
  };
}

/** Pure: the tint for one cell, as a CSS color-mix() into the card surface. */
export function cellTint(v: number, max: number): string | undefined {
  if (!max || !v) return undefined;
  const pct = Math.round(Math.sqrt(Math.min(1, Math.abs(v) / max)) * MAX_MIX);
  if (pct < 3) return undefined;
  return `color-mix(in srgb, var(${v > 0 ? "--heat-pos" : "--heat-neg"}) ${pct}%, var(--bg-card))`;
}

