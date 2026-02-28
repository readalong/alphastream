"use client";

import { STAGE_COLORS } from "@/lib/constants";
import { parseCategory } from "@/lib/utils";

interface StageBadgeProps {
  category: string;
  className?: string;
}

export function StageBadge({ category, className }: StageBadgeProps) {
  const code = parseCategory(category);
  const config = STAGE_COLORS[code] || { color: "#64748b", label: code };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${className || ""}`}
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
    >
      {config.label}
    </span>
  );
}
