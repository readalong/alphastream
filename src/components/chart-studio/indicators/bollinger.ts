import type { OHLCVBar } from "@/lib/types";

export function bollingerBands(
  data: OHLCVBar[],
  period = 20,
  stdDevMult = 2
): { time: string; upper: number; mid: number; lower: number }[] {
  const result: { time: string; upper: number; mid: number; lower: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - (period - 1); j <= i; j++) sum += data[j].close;
    const mid = sum / period;
    let variance = 0;
    for (let j = i - (period - 1); j <= i; j++) {
      const diff = data[j].close - mid;
      variance += diff * diff;
    }
    const sd = Math.sqrt(variance / period);
    result.push({ time: data[i].time, upper: mid + stdDevMult * sd, mid, lower: mid - stdDevMult * sd });
  }
  return result;
}
