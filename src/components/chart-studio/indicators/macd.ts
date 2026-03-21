import type { OHLCVBar } from "@/lib/types";

function emaValues(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length < period) return result;
  let emaVal = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = emaVal;
  for (let i = period; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k);
    result[i] = emaVal;
  }
  return result;
}

export function macd(
  data: OHLCVBar[],
  fast = 12,
  slow = 26,
  signal = 9
): { time: string; macd: number; signal: number; hist: number }[] {
  const closes = data.map((b) => b.close);
  const fastEMA = emaValues(closes, fast);
  const slowEMA = emaValues(closes, slow);

  const macdLine: number[] = [];
  const macdTimes: string[] = [];
  for (let i = 0; i < data.length; i++) {
    if (!isNaN(fastEMA[i]) && !isNaN(slowEMA[i])) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
      macdTimes.push(data[i].time);
    }
  }

  const signalLine = emaValues(macdLine, signal);
  const result: { time: string; macd: number; signal: number; hist: number }[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(signalLine[i])) continue;
    result.push({
      time: macdTimes[i],
      macd: macdLine[i],
      signal: signalLine[i],
      hist: macdLine[i] - signalLine[i],
    });
  }
  return result;
}
