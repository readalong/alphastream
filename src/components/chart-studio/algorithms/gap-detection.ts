import type { OHLCVBar } from "@/lib/types";
import type { PriceZone } from "../drawing-types";

/**
 * Detect price gaps in the last 300 bars.
 * Gap-up: open > prevClose * 1.005 → green zone (prev.close → open)
 * Gap-down: open < prevClose * 0.995 → red zone (open → prev.close)
 */
export function autoGapZones(data: OHLCVBar[]): PriceZone[] {
  if (data.length < 2) return [];

  const recent = data.slice(-300);
  const zones: PriceZone[] = [];
  const ts = Date.now();

  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];

    if (curr.open > prev.close * 1.005) {
      zones.push({
        id: `gap-up-${i}-${ts + i}`,
        type: "pricezone",
        priceMin: prev.close,
        priceMax: curr.open,
        color: "rgba(34,197,94,0.12)",
        borderColor: "#22c55e",
        label: "Gap Up",
      });
    } else if (curr.open < prev.close * 0.995) {
      zones.push({
        id: `gap-down-${i}-${ts + i}`,
        type: "pricezone",
        priceMin: curr.open,
        priceMax: prev.close,
        color: "rgba(239,68,68,0.12)",
        borderColor: "#ef4444",
        label: "Gap Down",
      });
    }
  }

  return zones;
}
