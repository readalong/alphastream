import type { OHLCVBar } from "@/lib/types";
import type { PriceZone } from "../drawing-types";
import { zigzag } from "./trendline";

/**
 * Auto-detect support and resistance zones by clustering zigzag pivots.
 * Clusters pivots within ±1% of each other; zones with ≥2 pivots are kept.
 */
export function autoSRZones(data: OHLCVBar[]): PriceZone[] {
  if (data.length < 10) return [];

  const pivots = zigzag(data, 0.03);
  const highs = pivots.filter((p) => p.type === "high").map((p) => p.price);
  const lows  = pivots.filter((p) => p.type === "low").map((p) => p.price);

  return [
    ...clusterPivots(highs, "resistance"),
    ...clusterPivots(lows, "support"),
  ];
}

function clusterPivots(prices: number[], kind: "support" | "resistance"): PriceZone[] {
  if (prices.length === 0) return [];

  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let current: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i] - current[0]) / current[0] <= 0.01) {
      current.push(sorted[i]);
    } else {
      clusters.push(current);
      current = [sorted[i]];
    }
  }
  clusters.push(current);

  const ts = Date.now();
  return clusters
    .filter((c) => c.length >= 2)
    .map((cluster, idx) => {
      const minP = Math.min(...cluster) * 0.999;
      const maxP = Math.max(...cluster) * 1.001;
      const isSupport = kind === "support";
      return {
        id: `${kind}-zone-${idx}-${ts + idx}`,
        type: "pricezone" as const,
        priceMin: minP,
        priceMax: maxP,
        color: isSupport ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
        borderColor: isSupport ? "#22c55e" : "#ef4444",
        label: isSupport ? "Support" : "Resistance",
      };
    });
}
