"use client";

import { cn } from "@/lib/utils";

interface SubScoreBarProps {
  label: string;
  value: number;
  max: number;
  color: "blue" | "emerald" | "purple";
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  purple: "bg-purple-500",
};

export function SubScoreBar({ label, value, max, color }: SubScoreBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-6 text-[var(--text-muted)] font-medium shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
        <div
          className={cn("h-full rounded-full transition-all", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-[var(--text-muted)] tabular-nums shrink-0">
        {value}/{max}
      </span>
    </div>
  );
}
