"use client";

import { cn } from "@/lib/utils";

type ViewFilter = "all" | "has_resistance" | "at_ath";

interface ViewToggleProps {
  value: ViewFilter;
  onChange: (v: ViewFilter) => void;
  counts?: { total: number; withResistance: number; atAth: number };
}

export function ViewToggle({ value, onChange, counts }: ViewToggleProps) {
  const options: { key: ViewFilter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: counts?.total },
    { key: "has_resistance", label: "Has Resistance", count: counts?.withResistance },
    { key: "at_ath", label: "At ATH", count: counts?.atAth },
  ];

  return (
    <div className="inline-flex rounded-md border border-[var(--border)] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.key
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          {opt.label}
          {opt.count != null && (
            <span className="ml-1.5 text-xs opacity-75">{opt.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
