"use client";

import { cn } from "@/lib/utils";

interface CMFBarProps {
  value: number;
}

export function CMFBar({ value }: CMFBarProps) {
  const isPositive = value >= 0;
  // normalize -1..+1 to a 0..50% bar from center
  const barPct = Math.min(Math.abs(value) * 50, 50);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[var(--text-muted)] w-8 shrink-0">CMF</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--text-muted)]/30" />
        <div
          className={cn(
            "absolute top-0 h-full rounded-full",
            isPositive ? "bg-emerald-500" : "bg-red-500"
          )}
          style={
            isPositive
              ? { left: "50%", width: `${barPct}%` }
              : { right: "50%", width: `${barPct}%` }
          }
        />
      </div>
      <span
        className={cn(
          "w-12 text-right font-medium tabular-nums shrink-0",
          isPositive ? "text-emerald-500" : "text-red-500"
        )}
      >
        {value > 0 ? "+" : ""}
        {value.toFixed(2)}
      </span>
    </div>
  );
}
