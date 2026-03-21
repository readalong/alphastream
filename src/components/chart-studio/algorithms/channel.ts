import type { OHLCVBar } from "@/lib/types";
import type { Channel } from "../drawing-types";
import { autoTrendlines } from "./trendline";

/**
 * Creates a price channel from the support trendline by finding the
 * parallel line through the highest high within the trendline's time segment.
 *
 * Explicitly selects the support line (label === "Support") rather than
 * blindly taking trendlines[0], which may be the resistance line.
 * Falls back to the first trendline if no support label is found.
 */
export function autoChannel(data: OHLCVBar[]): Channel | null {
  const trendlines = autoTrendlines(data);
  if (trendlines.length === 0) return null;

  // Explicitly pick the support line
  const support = trendlines.find((t) => t.label === "Support") ?? trendlines[0];
  const { p1, p2 } = support;

  const t1 = p1.time;
  const t2 = p2.time;
  const segment = data.filter((b) => b.time >= t1 && b.time <= t2);

  // Find the highest high within the support line's time segment
  let channelTopPrice: number | null = null;
  for (const bar of segment) {
    if (channelTopPrice === null || bar.high > channelTopPrice) {
      channelTopPrice = bar.high;
    }
  }

  let offset: number;
  if (channelTopPrice !== null) {
    // Offset is the distance from the top of the support line to the highest high
    offset = channelTopPrice - Math.max(p1.price, p2.price);
  } else {
    // Geometric fallback: no segment data available
    offset = Math.abs(p2.price - p1.price) * 0.5;
  }

  // Ensure a minimum visible offset (at least 0.5% of the lower support price)
  const minOffset = Math.min(p1.price, p2.price) * 0.005;
  const safeOffset = Math.max(offset, minOffset);

  return {
    id: `channel-auto-${Date.now()}`,
    type: "channel",
    mainLine: [p1, p2],
    parallelLine: [
      { time: p1.time, price: p1.price + safeOffset },
      { time: p2.time, price: p2.price + safeOffset },
    ],
    color: "#6366f1",
  };
}
