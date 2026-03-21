import type { OHLCVBar } from "@/lib/types";

export function atr(data: OHLCVBar[], period = 14): number[] {
  if (data.length < 2) return [];

  const trs: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    trs.push(Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    ));
  }

  const atrValues: number[] = new Array(data.length).fill(NaN);
  if (trs.length < period) return atrValues;

  let current = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atrValues[period] = current;

  for (let i = period; i < trs.length; i++) {
    current = (current * (period - 1) + trs[i]) / period;
    atrValues[i + 1] = current;
  }
  return atrValues;
}

export function atrEnvelope(
  data: OHLCVBar[],
  period = 14,
  mult = 2
): { time: string; upper: number; lower: number }[] {
  const atrVals = atr(data, period);
  const result: { time: string; upper: number; lower: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(atrVals[i])) continue;
    result.push({
      time: data[i].time,
      upper: data[i].close + mult * atrVals[i],
      lower: data[i].close - mult * atrVals[i],
    });
  }
  return result;
}
