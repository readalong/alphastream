import type { OHLCVBar } from "@/lib/types";
import type { HLine } from "../drawing-types";

/**
 * Calculate weekly pivot points from the most recent completed week.
 */
export function autoPivotPoints(data: OHLCVBar[]): HLine[] {
  if (data.length < 5) return [];

  const weekMap = new Map<string, OHLCVBar[]>();
  for (const bar of data) {
    const key = getMondayKey(bar.time);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(bar);
  }

  const weeks = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (weeks.length < 2) return [];

  const [, weekBars] = weeks[weeks.length - 2];
  const H = Math.max(...weekBars.map((b) => b.high));
  const L = Math.min(...weekBars.map((b) => b.low));
  const C = weekBars[weekBars.length - 1].close;

  const PP = (H + L + C) / 3;
  const R1 = 2 * PP - L;
  const R2 = PP + (H - L);
  const R3 = H + 2 * (PP - L);
  const S1 = 2 * PP - H;
  const S2 = PP - (H - L);
  const S3 = L - 2 * (H - PP);

  const ts = Date.now();
  return [
    { id: `pp-${ts}`,     type: "hline", price: PP, color: "#64748b", label: "PP",  isDashed: false },
    { id: `r1-${ts + 1}`, type: "hline", price: R1, color: "#ef4444", label: "R1",  isDashed: true },
    { id: `r2-${ts + 2}`, type: "hline", price: R2, color: "#ef4444", label: "R2",  isDashed: true },
    { id: `r3-${ts + 3}`, type: "hline", price: R3, color: "#ef4444", label: "R3",  isDashed: true },
    { id: `s1-${ts + 4}`, type: "hline", price: S1, color: "#22c55e", label: "S1",  isDashed: true },
    { id: `s2-${ts + 5}`, type: "hline", price: S2, color: "#22c55e", label: "S2",  isDashed: true },
    { id: `s3-${ts + 6}`, type: "hline", price: S3, color: "#22c55e", label: "S3",  isDashed: true },
  ];
}

function getMondayKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}
