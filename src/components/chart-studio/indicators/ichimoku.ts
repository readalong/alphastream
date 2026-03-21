import type { OHLCVBar } from "@/lib/types";

function midpoint(bars: OHLCVBar[]): number {
  const high = Math.max(...bars.map((b) => b.high));
  const low = Math.min(...bars.map((b) => b.low));
  return (high + low) / 2;
}

function addCalendarDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ichimoku(data: OHLCVBar[]): {
  time: string;
  tenkan?: number;
  kijun?: number;
  senkouA?: number;
  senkouB?: number;
  chikou?: number;
}[] {
  const DISPLACEMENT = 26;

  const resultMap = new Map<string, {
    tenkan?: number; kijun?: number;
    senkouA?: number; senkouB?: number; chikou?: number;
  }>();

  const ensure = (t: string) => { if (!resultMap.has(t)) resultMap.set(t, {}); };

  for (let i = 0; i < data.length; i++) {
    const t = data[i].time;
    ensure(t);

    if (i >= 8) resultMap.get(t)!.tenkan = midpoint(data.slice(i - 8, i + 1));
    if (i >= 25) resultMap.get(t)!.kijun = midpoint(data.slice(i - 25, i + 1));

    // Chikou: current close plotted 26 bars behind
    if (i >= DISPLACEMENT) {
      const pastTime = data[i - DISPLACEMENT].time;
      ensure(pastTime);
      resultMap.get(pastTime)!.chikou = data[i].close;
    }

    // Senkou A & B: plotted ~26 trading days ahead (~36 calendar days)
    if (i >= 25) {
      const tenk = midpoint(data.slice(i - 8, i + 1));
      const kij  = midpoint(data.slice(i - 25, i + 1));
      const sA   = (tenk + kij) / 2;
      const sB   = i >= 51
        ? midpoint(data.slice(i - 51, i + 1))
        : midpoint(data.slice(0, i + 1));
      const futureTime = addCalendarDays(t, Math.round(DISPLACEMENT * 1.4));
      ensure(futureTime);
      const fe = resultMap.get(futureTime)!;
      if (fe.senkouA === undefined) { fe.senkouA = sA; fe.senkouB = sB; }
    }
  }

  return [...resultMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, vals]) => ({ time, ...vals }));
}
