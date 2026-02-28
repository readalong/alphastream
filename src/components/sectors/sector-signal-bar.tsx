"use client";

import { STAGE_COLORS } from "@/lib/constants";
import { parseCategory } from "@/lib/utils";
import type { ScreenerResult } from "@/lib/types";

interface SectorSignalBarProps {
  results: ScreenerResult[];
}

export function SectorSignalBar({ results }: SectorSignalBarProps) {
  const counts: Record<string, number> = {};
  for (const r of results) {
    const cat = parseCategory(r.category);
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const total = results.length || 1;
  const segments = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => {
      const order = ["S", "A", "B", "X", "2", "1", "1D", "0", "3", "4"];
      return order.indexOf(a) - order.indexOf(b);
    });

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-primary)]">
      {segments.map(([code, count]) => (
        <div
          key={code}
          style={{
            width: `${(count / total) * 100}%`,
            backgroundColor: STAGE_COLORS[code]?.color || "#64748b",
          }}
          title={`${STAGE_COLORS[code]?.label || code}: ${count}`}
        />
      ))}
    </div>
  );
}
