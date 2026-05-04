"use client";

import { cn } from "@/lib/utils";
import type { SectorRotationPoint, RotationQuadrant } from "@/lib/types";

const quadrantConfig: Record<
  RotationQuadrant,
  { label: string; bg: string; position: string }
> = {
  LEADING:   { label: "Leading",   bg: "bg-emerald-500/8", position: "top-2 right-2" },
  WEAKENING: { label: "Weakening", bg: "bg-amber-500/8",   position: "bottom-2 right-2" },
  LAGGING:   { label: "Lagging",   bg: "bg-red-500/8",     position: "bottom-2 left-2" },
  IMPROVING: { label: "Improving", bg: "bg-blue-500/8",    position: "top-2 left-2" },
};

function normalize(val: number, min: number, max: number): number {
  const range = max - min || 1;
  return ((val - min) / range) * 100;
}

interface SectorRotationMapProps {
  points: SectorRotationPoint[];
}

export function SectorRotationMap({ points }: SectorRotationMapProps) {
  if (!points.length) return null;

  const trendMin = Math.min(...points.map((p) => p.trend_strength));
  const trendMax = Math.max(...points.map((p) => p.trend_strength));
  const momMin = Math.min(...points.map((p) => p.momentum));
  const momMax = Math.max(...points.map((p) => p.momentum));

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-square max-w-[520px] mx-auto border border-[var(--border)] rounded-lg overflow-hidden select-none">
        {/* Quadrant backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
          <div className={cn("border-r border-b border-[var(--border)]/60", quadrantConfig.IMPROVING.bg)} />
          <div className={cn("border-b border-[var(--border)]/60", quadrantConfig.LEADING.bg)} />
          <div className={cn("border-r border-[var(--border)]/60", quadrantConfig.LAGGING.bg)} />
          <div className={quadrantConfig.WEAKENING.bg} />
        </div>

        {/* Quadrant labels */}
        {(Object.entries(quadrantConfig) as [RotationQuadrant, typeof quadrantConfig[RotationQuadrant]][]).map(
          ([, cfg]) => (
            <span
              key={cfg.label}
              className={cn(
                "absolute text-[10px] font-medium text-[var(--text-muted)] pointer-events-none",
                cfg.position
              )}
            >
              {cfg.label}
            </span>
          )
        )}

        {/* Crosshair lines */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]/60 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border)]/60 pointer-events-none" />

        {/* Sector dots */}
        {points.map((p) => {
          const x = normalize(p.trend_strength, trendMin, trendMax);
          const y = 100 - normalize(p.momentum, momMin, momMax);
          // Clamp 5–95% so labels don't get cut off
          const cx = Math.max(5, Math.min(95, x));
          const cy = Math.max(5, Math.min(95, y));
          const size = 8 + (p.composite_score / 100) * 14;

          return (
            <div
              key={p.etf}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-default"
              style={{ left: `${cx}%`, top: `${cy}%` }}
              title={`${p.name}: Score ${p.composite_score}, Trend ${p.trend_strength.toFixed(0)}, Mom ${p.momentum.toFixed(0)}`}
            >
              <div
                className="rounded-full bg-[var(--accent)] opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ width: size, height: size }}
              />
              <span
                className="text-[9px] text-[var(--text-muted)] mt-0.5 whitespace-nowrap leading-none"
                style={{ fontSize: "9px" }}
              >
                {p.etf}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-[var(--text-muted)] max-w-[520px] mx-auto px-1">
        <span>← Weak Trend</span>
        <span className="text-center">X: Trend Strength · Y: Momentum (RSI)</span>
        <span>Strong Trend →</span>
      </div>
    </div>
  );
}
