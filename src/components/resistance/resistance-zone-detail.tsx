"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ResistanceLevel } from "@/lib/types";

interface ResistanceZoneDetailProps {
  level: ResistanceLevel;
  label: string;
}

export function ResistanceZoneDetail({ level, label }: ResistanceZoneDetailProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[var(--border)]/50 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-[var(--bg-primary)]/50 transition-colors"
      >
        <span className="text-[var(--text-muted)]">Zone Details ({label})</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Range</span>
            <span className="font-mono text-[var(--text-primary)]">
              ${formatPrice(level.zone_low)} &mdash; ${formatPrice(level.zone_high)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Touches</span>
            <span className="text-[var(--text-primary)]">{level.strength}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Source</span>
            <span className="text-[var(--text-primary)]">{level.source}</span>
          </div>
        </div>
      )}
    </div>
  );
}
