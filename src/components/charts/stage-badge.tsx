"use client";

import { STAGE_COLORS } from "@/lib/constants";
import { parseCategory } from "@/lib/utils";

interface StageBadgeProps {
  category: string;
  className?: string;
}

export function StageBadge({ category, className }: StageBadgeProps) {
  const code = parseCategory(category);
  const config = STAGE_COLORS[code] || { color: "var(--text-muted)", label: code };

  // Typographic, not a pill: the stage code carries its bull/bear/caution
  // meaning through color alone, set in the mono face used for every
  // other categorical signal in the app.
  return (
    <span
      className={`font-mono text-xs font-semibold ${className || ""}`}
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  );
}
