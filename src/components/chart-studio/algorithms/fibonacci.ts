import type { OHLCVBar } from "@/lib/types";
import type { FibRetracement, FibLevel } from "../drawing-types";
import { zigzag } from "./trendline";

const FIB_LEVELS: Array<{ pct: number; label: string; color: string; isDashed?: boolean }> = [
  { pct: 0,     label: "0%",              color: "#ef4444" },
  { pct: 0.236, label: "23.6%",           color: "#f97316" },
  { pct: 0.382, label: "38.2%",           color: "#eab308" },
  { pct: 0.5,   label: "50%",             color: "#64748b" },
  { pct: 0.618, label: "61.8% \u2014 Golden", color: "#6366f1" },
  { pct: 0.786, label: "78.6%",           color: "#8b5cf6" },
  { pct: 1,     label: "100%",            color: "#ef4444" },
  { pct: 1.272, label: "127.2% Ext",      color: "#22c55e", isDashed: true },
  { pct: 1.382, label: "138.2% Ext",      color: "#22c55e", isDashed: true },
  { pct: 1.618, label: "161.8% Ext",      color: "#22c55e", isDashed: true },
];

/**
 * Auto-compute Fibonacci retracement anchored to the most recent dominant swing.
 * Adaptive threshold: tries 5% → 3% → 1.5%, stops at first that yields ≥2 pivots.
 * Validates swing is at least 2% move.
 */
export function autoFibonacci(data: OHLCVBar[]): FibRetracement {
  if (data.length === 0) throw new Error("No data");

  let pivots = zigzag(data, 0.05);
  if (pivots.length < 2) pivots = zigzag(data, 0.03);
  if (pivots.length < 2) pivots = zigzag(data, 0.015);

  const fallback = () => {
    let highIdx = 0, lowIdx = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].high > data[highIdx].high) highIdx = i;
      if (data[i].low < data[lowIdx].low) lowIdx = i;
    }
    const isTrendUp = lowIdx < highIdx;
    const sh = data[highIdx].high;
    const sl = data[lowIdx].low;
    const p1 = isTrendUp ? { time: data[lowIdx].time, price: sl } : { time: data[highIdx].time, price: sh };
    const p2 = isTrendUp ? { time: data[highIdx].time, price: sh } : { time: data[lowIdx].time, price: sl };
    return buildFib(p1, p2, sh, sl, isTrendUp);
  };

  if (pivots.length < 2) return fallback();

  const lastPivot = pivots[pivots.length - 1];
  const priorPivot = pivots[pivots.length - 2];

  const isUptrend = lastPivot.type === "high";
  const swingHigh = isUptrend ? lastPivot.price : priorPivot.price;
  const swingLow = isUptrend ? priorPivot.price : lastPivot.price;

  // Validate swing is at least 2%
  if (swingLow > 0 && (swingHigh - swingLow) / swingLow < 0.02) return fallback();

  const p1 = { time: priorPivot.time, price: priorPivot.price };
  const p2 = { time: lastPivot.time, price: lastPivot.price };
  return buildFib(p1, p2, swingHigh, swingLow, isUptrend);
}

function buildFib(
  p1: { time: string; price: number },
  p2: { time: string; price: number },
  swingHigh: number,
  swingLow: number,
  isUptrend: boolean
): FibRetracement {
  const range = swingHigh - swingLow;
  const levels: FibLevel[] = FIB_LEVELS.map(({ pct, label, color, isDashed }) => {
    const price = isUptrend
      ? pct <= 1 ? swingHigh - range * pct : swingHigh + range * (pct - 1)
      : pct <= 1 ? swingLow + range * pct  : swingLow - range * (pct - 1);
    return { pct, price, label, color, isDashed: isDashed ?? false };
  });
  return {
    id: `fib-auto-${Date.now()}`,
    type: "fibonacci",
    p1, p2, levels, isUptrend,
  };
}
