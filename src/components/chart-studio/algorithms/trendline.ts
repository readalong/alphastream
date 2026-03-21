import type { OHLCVBar } from "@/lib/types";
import type { Point, Trendline } from "../drawing-types";

export interface Pivot {
  idx: number;
  time: string;
  price: number;
  type: "high" | "low";
}

/**
 * Zigzag pivot detection.
 * Returns alternating high/low pivots where each move exceeds `thresholdPct`.
 */
export function zigzag(data: OHLCVBar[], thresholdPct = 0.03): Pivot[] {
  if (data.length < 3) return [];

  const pivots: Pivot[] = [];
  let direction: "up" | "down" | null = null;
  let lastPivotIdx = 0;
  let lastPivotPrice = data[0].close;

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;

    // Use else-if so only ONE branch fires per bar, preventing
    // a single bar from both transitioning direction AND immediately reversing.
    if (direction === null || direction === "down") {
      if (high > lastPivotPrice * (1 + thresholdPct)) {
        // Commit the previous low pivot (if we were in a downtrend)
        if (direction === "down") {
          pivots.push({
            idx: lastPivotIdx,
            time: data[lastPivotIdx].time,
            price: data[lastPivotIdx].low,
            type: "low",
          });
        }
        direction = "up";
        lastPivotIdx = i;
        lastPivotPrice = high;
      } else if (low < lastPivotPrice) {
        // Track the new low while waiting for an upward breakout
        lastPivotIdx = i;
        lastPivotPrice = low;
      }
    } else if (direction === "up") {
      if (low < lastPivotPrice * (1 - thresholdPct)) {
        // Commit the previous high pivot
        pivots.push({
          idx: lastPivotIdx,
          time: data[lastPivotIdx].time,
          price: data[lastPivotIdx].high,
          type: "high",
        });
        direction = "down";
        lastPivotIdx = i;
        lastPivotPrice = low;
      } else if (high > lastPivotPrice) {
        // Track the new high while waiting for a downward breakout
        lastPivotIdx = i;
        lastPivotPrice = high;
      }
    }
  }

  // Commit the final in-progress pivot
  if (direction !== null) {
    pivots.push({
      idx: lastPivotIdx,
      time: data[lastPivotIdx].time,
      price:
        direction === "up"
          ? data[lastPivotIdx].high
          : data[lastPivotIdx].low,
      type: direction === "up" ? "high" : "low",
    });
  }

  return pivots;
}

/**
 * Auto-detect support and resistance trendlines from the last two swing pivots.
 */
export function autoTrendlines(data: OHLCVBar[]): Trendline[] {
  const pivots = zigzag(data, 0.03);
  const lows = pivots.filter((p) => p.type === "low");
  const highs = pivots.filter((p) => p.type === "high");

  const lines: Trendline[] = [];

  if (lows.length >= 2) {
    const a = lows[lows.length - 2];
    const b = lows[lows.length - 1];
    lines.push({
      id: `tl-support-${Date.now()}`,
      type: "trendline",
      p1: { time: a.time, price: a.price },
      p2: { time: b.time, price: b.price },
      color: "#22c55e",
      label: "Support",
    });
  }

  if (highs.length >= 2) {
    const a = highs[highs.length - 2];
    const b = highs[highs.length - 1];
    lines.push({
      id: `tl-resistance-${Date.now() + 1}`,
      type: "trendline",
      p1: { time: a.time, price: a.price },
      p2: { time: b.time, price: b.price },
      color: "#ef4444",
      label: "Resistance",
    });
  }

  return lines;
}

export function makePoint(bar: OHLCVBar, useHigh: boolean): Point {
  return { time: bar.time, price: useHigh ? bar.high : bar.low };
}
