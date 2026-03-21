import type { OHLCVBar } from "@/lib/types";
import type { CandlePattern } from "../drawing-types";

/**
 * Detect common candlestick reversal patterns in the last 100 bars.
 */
export function autoCandlePatterns(data: OHLCVBar[]): CandlePattern[] {
  if (data.length < 3) return [];

  const recent = data.slice(-100);
  const patterns: CandlePattern[] = [];

  for (let i = 2; i < recent.length; i++) {
    const b0 = recent[i - 2];
    const b1 = recent[i - 1];
    const b2 = recent[i];

    const body2 = Math.abs(b2.close - b2.open);
    const totalRange2 = b2.high - b2.low;
    const upperWick2 = b2.high - Math.max(b2.close, b2.open);
    const lowerWick2 = Math.min(b2.close, b2.open) - b2.low;

    if (totalRange2 > 0) {
      if (lowerWick2 >= 2 * body2 && upperWick2 <= 0.5 * body2 && b2.close > b2.open && body2 > 0) {
        patterns.push(makePattern(b2, "Hammer", true));
        continue;
      }
      if (upperWick2 >= 2 * body2 && lowerWick2 <= 0.5 * body2 && b2.close < b2.open && body2 > 0) {
        patterns.push(makePattern(b2, "Inv Hammer", false));
        continue;
      }
      if (body2 < 0.03 * totalRange2) {
        patterns.push(makePattern(b2, "Doji", b2.close >= b2.open));
        continue;
      }
    }

    const body1 = Math.abs(b1.close - b1.open);
    const body2b = Math.abs(b2.close - b2.open);

    if (b1.close < b1.open && b2.close > b2.open &&
        b2.open <= b1.close && b2.close >= b1.open && body2b > body1) {
      patterns.push(makePattern(b2, "Bull Engulf", true));
      continue;
    }
    if (b1.close > b1.open && b2.close < b2.open &&
        b2.open >= b1.close && b2.close <= b1.open && body2b > body1) {
      patterns.push(makePattern(b2, "Bear Engulf", false));
      continue;
    }

    const b0body = Math.abs(b0.close - b0.open);
    const b1body = Math.abs(b1.close - b1.open);
    const b0mid = (b0.open + b0.close) / 2;

    if (b0.close < b0.open && b1body < 0.5 * b0body &&
        b2.close > b2.open && b2.close > b0mid) {
      patterns.push(makePattern(b2, "Morning Star", true));
      continue;
    }
    if (b0.close > b0.open && b1body < 0.5 * b0body &&
        b2.close < b2.open && b2.close < b0mid) {
      patterns.push(makePattern(b2, "Evening Star", false));
    }
  }

  return patterns;
}

function makePattern(bar: OHLCVBar, label: string, bullish: boolean): CandlePattern {
  const offset = (bar.high - bar.low) * 0.02;
  return {
    id: `cp-${label.replace(/\s+/g, "")}-${bar.time}-${Date.now()}`,
    type: "candlepattern",
    time: bar.time,
    price: bullish ? bar.low - offset : bar.high + offset,
    label,
    bullish,
  };
}
