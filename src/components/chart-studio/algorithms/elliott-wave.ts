import type { OHLCVBar } from "@/lib/types";
import type { ElliottWave, Point } from "../drawing-types";
import { zigzag, type Pivot } from "./trendline";

/**
 * Heuristic Elliott Wave suggestion.
 * Adaptive threshold: tries 7% → 5% → 3%, stops at first that yields ≥6 pivots.
 * Confidence is based on the 3 mandatory EW rules ONLY (guidelines are informational).
 */
export function suggestWaves(data: OHLCVBar[]): ElliottWave {
  let pivots = zigzag(data, 0.07);
  if (pivots.length < 6) pivots = zigzag(data, 0.05);
  if (pivots.length < 6) pivots = zigzag(data, 0.03);

  const impulse = findImpulse(pivots);
  if (impulse) return impulse;

  const abc = findABC(pivots);
  if (abc) return abc;

  if (pivots.length >= 2) {
    const last2 = pivots.slice(-2);
    return {
      id: `ew-stub-${Date.now()}`,
      type: "elliott",
      points: last2.map((p) => ({ time: p.time, price: p.price })),
      labels: ["?", "?"],
      isConfident: false,
    };
  }

  const mid = data[Math.floor(data.length / 2)];
  return {
    id: `ew-none-${Date.now()}`,
    type: "elliott",
    points: [{ time: mid.time, price: mid.close }],
    labels: ["?"],
    isConfident: false,
  };
}

function findImpulse(pivots: Pivot[]): ElliottWave | null {
  const startIdx = Math.max(0, pivots.length - 10);

  for (let i = pivots.length - 6; i >= startIdx; i--) {
    const w = pivots.slice(i, i + 6);
    if (w.length < 6) continue;

    const isBullish =
      w[0].type === "low"  && w[1].type === "high" &&
      w[2].type === "low"  && w[3].type === "high" &&
      w[4].type === "low"  && w[5].type === "high";

    const isBearish =
      w[0].type === "high" && w[1].type === "low"  &&
      w[2].type === "high" && w[3].type === "low"  &&
      w[4].type === "high" && w[5].type === "low";

    if (!isBullish && !isBearish) continue;

    const points: Point[] = w.map((p) => ({ time: p.time, price: p.price }));

    if (isBullish) {
      const W1 = w[1].price - w[0].price;
      const W3 = w[3].price - w[2].price;
      const W5 = w[5].price - w[4].price;
      const rule1 = w[2].price > w[0].price;
      const rule2 = W3 >= W1 || W3 >= W5;
      const rule3 = w[4].price > w[1].price;
      return {
        id: `ew-${Date.now()}`,
        type: "elliott",
        points,
        labels: ["", "1", "2", "3", "4", "5"],
        isConfident: rule1 && rule2 && rule3,
      };
    }

    if (isBearish) {
      const W1 = w[0].price - w[1].price;
      const W3 = w[2].price - w[3].price;
      const W5 = w[4].price - w[5].price;
      const rule1 = w[2].price < w[0].price;
      const rule2 = W3 >= W1 || W3 >= W5;
      const rule3 = w[4].price < w[1].price;
      return {
        id: `ew-${Date.now()}`,
        type: "elliott",
        points,
        labels: ["", "1", "2", "3", "4", "5"],
        isConfident: rule1 && rule2 && rule3,
      };
    }
  }

  return null;
}

function findABC(pivots: Pivot[]): ElliottWave | null {
  const startIdx = Math.max(0, pivots.length - 6);

  for (let i = pivots.length - 4; i >= startIdx; i--) {
    const w = pivots.slice(i, i + 4);
    if (w.length < 4) continue;

    const isBearishABC =
      w[0].type === "high" && w[1].type === "low" &&
      w[2].type === "high" && w[3].type === "low";

    const isBullishABC =
      w[0].type === "low"  && w[1].type === "high" &&
      w[2].type === "low"  && w[3].type === "high";

    if (!isBearishABC && !isBullishABC) continue;

    const points: Point[] = w.map((p) => ({ time: p.time, price: p.price }));

    if (isBearishABC) {
      const WA = w[0].price - w[1].price;
      const WB = w[2].price - w[1].price;
      const WC = w[2].price - w[3].price;
      return {
        id: `ew-abc-${Date.now()}`,
        type: "elliott",
        points,
        labels: ["", "A", "B", "C"],
        isConfident: WA > 0 && WB < WA && w[3].price < w[1].price && WC > 0,
      };
    }

    if (isBullishABC) {
      const WA = w[1].price - w[0].price;
      const WB = w[1].price - w[2].price;
      const WC = w[3].price - w[2].price;
      return {
        id: `ew-abc-${Date.now()}`,
        type: "elliott",
        points,
        labels: ["", "A", "B", "C"],
        isConfident: WA > 0 && WB < WA && w[3].price > w[1].price && WC > 0,
      };
    }
  }

  return null;
}
