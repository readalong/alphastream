import type { OHLCVBar } from "@/lib/types";

export function volumeMA(data: OHLCVBar[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - (period - 1); j <= i; j++) sum += data[j].volume;
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}
