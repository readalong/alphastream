"use client";

import { useState } from "react";
import {
  MousePointer2,
  TrendingUp,
  Minus,
  Activity,
  Zap,
  Trash2,
  Square,
  ChevronDown,
  GitFork,
  Layers,
  AlignVerticalDistributeCenter,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrawingTool, IndicatorSettings } from "./drawing-types";
import type { OHLCVPeriod } from "@/lib/types";

export type { DrawingTool };
export type { OHLCVPeriod };

interface ChartToolbarProps {
  period: OHLCVPeriod;
  onPeriodChange: (p: OHLCVPeriod) => void;
  activeTool: DrawingTool;
  onToolChange: (t: DrawingTool) => void;
  onAutoFib: () => void;
  onAutoTrendlines: () => void;
  onAutoChannel: () => void;
  onAutoElliott: () => void;
  onAutoSRZones: () => void;
  onAutoGapDetection: () => void;
  onAutoPivotPoints: () => void;
  onAutoCandlePatterns: () => void;
  onClearAll: () => void;
  indicators: IndicatorSettings;
  onIndicatorChange: (key: keyof IndicatorSettings, value: boolean) => void;
  isLoading?: boolean;
}

const PERIODS: Array<{ value: OHLCVPeriod; label: string }> = [
  { value: "1y",  label: "1Y" },
  { value: "2y",  label: "2Y" },
  { value: "5y",  label: "5Y" },
  { value: "max", label: "All" },
];

const TOOLS: Array<{ value: DrawingTool; icon: React.FC<{ className?: string }>; label: string }> = [
  { value: "cursor",       icon: MousePointer2,                    label: "Cursor" },
  { value: "trendline",    icon: TrendingUp,                       label: "Trendline" },
  { value: "channel",      icon: Activity,                         label: "Channel" },
  { value: "fibonacci",    icon: Minus,                            label: "Fibonacci" },
  { value: "hline",        icon: Minus,                            label: "H Line" },
  { value: "rectangle",    icon: Square,                           label: "Rectangle" },
  { value: "pitchfork",    icon: GitFork,                          label: "Pitchfork (3 clicks)" },
  { value: "fibfan",       icon: Layers,                           label: "Fib Fan" },
  { value: "fibtimezones", icon: AlignVerticalDistributeCenter,    label: "Fib Time Zones" },
  { value: "wyckoff",      icon: BarChart3,                        label: "Wyckoff Phase" },
];

const INDICATOR_GROUPS = [
  {
    label: "Moving Averages",
    items: [
      { key: "sma20"  as const, label: "SMA 20",  color: "#3b82f6" },
      { key: "sma50"  as const, label: "SMA 50",  color: "#f97316" },
      { key: "sma150" as const, label: "SMA 150", color: "#a855f7" },
      { key: "sma200" as const, label: "SMA 200", color: "#ef4444" },
      { key: "volumeMA" as const, label: "Vol MA", color: "#94a3b8" },
    ],
  },
  {
    label: "Bands",
    items: [
      { key: "bollingerBands" as const, label: "Bollinger", color: "#60a5fa" },
      { key: "atrEnvelope"    as const, label: "ATR Env",   color: "#f59e0b" },
    ],
  },
  {
    label: "Trend",
    items: [
      { key: "ichimoku" as const, label: "Ichimoku", color: "#06b6d4" },
    ],
  },
  {
    label: "Oscillators",
    items: [
      { key: "rsi"  as const, label: "RSI 14", color: "#a855f7" },
      { key: "macd" as const, label: "MACD",   color: "#3b82f6" },
    ],
  },
];

export function ChartToolbar({
  period,
  onPeriodChange,
  activeTool,
  onToolChange,
  onAutoFib,
  onAutoTrendlines,
  onAutoChannel,
  onAutoElliott,
  onAutoSRZones,
  onAutoGapDetection,
  onAutoPivotPoints,
  onAutoCandlePatterns,
  onClearAll,
  indicators,
  onIndicatorChange,
  isLoading,
}: ChartToolbarProps) {
  const [studiesOpen, setStudiesOpen] = useState(false);
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);

  const activeIndicatorCount = Object.values(indicators).filter(Boolean).length;

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-card)]">
        {/* Period picker */}
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--border)] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              disabled={isLoading}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Drawing tools */}
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--border)] p-0.5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => onToolChange(t.value)}
                title={t.label}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  activeTool === t.value
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Studies dropdown */}
        <div className="relative">
          <button
            onClick={() => { setStudiesOpen((o) => !o); setIndicatorsOpen(false); }}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors",
              studiesOpen
                ? "border-[var(--accent)]/60 text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <Zap className="h-3 w-3" />
            Studies
            <ChevronDown className={cn("h-3 w-3 transition-transform", studiesOpen && "rotate-180")} />
          </button>
        </div>

        {/* Indicators panel toggle */}
        <button
          onClick={() => { setIndicatorsOpen((o) => !o); setStudiesOpen(false); }}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors",
            indicatorsOpen || activeIndicatorCount > 0
              ? "border-[var(--accent)]/60 text-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <Activity className="h-3 w-3" />
          Indicators
          {activeIndicatorCount > 0 && (
            <span className="ml-0.5 rounded-full bg-[var(--accent)] text-white text-xs px-1">
              {activeIndicatorCount}
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 transition-transform", indicatorsOpen && "rotate-180")} />
        </button>

        <div className="flex-1" />

        {/* Clear all */}
        <button
          onClick={onClearAll}
          title="Clear all drawings"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--short)] hover:border-[var(--short)]/40 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear All
        </button>
      </div>

      {/* Studies dropdown panel */}
      {studiesOpen && (
        <div className="absolute top-full left-0 right-0 z-20 bg-[var(--bg-card)] border-b border-[var(--border)] px-3 py-2 shadow-lg">
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Fibonacci",       icon: "⚡", fn: onAutoFib,           color: "text-amber-400  hover:border-amber-400/40" },
              { label: "Trendlines",      icon: "⚡", fn: onAutoTrendlines,    color: "text-green-400  hover:border-green-400/40" },
              { label: "Channel",         icon: "⚡", fn: onAutoChannel,       color: "text-purple-400 hover:border-purple-400/40" },
              { label: "S/R Zones",       icon: "⚡", fn: onAutoSRZones,       color: "text-blue-400   hover:border-blue-400/40" },
              { label: "Gaps",            icon: "⚡", fn: onAutoGapDetection,  color: "text-sky-400    hover:border-sky-400/40" },
              { label: "Pivot Points",    icon: "⚡", fn: onAutoPivotPoints,   color: "text-orange-400 hover:border-orange-400/40" },
              { label: "Candle Patterns", icon: "⚡", fn: onAutoCandlePatterns,color: "text-rose-400   hover:border-rose-400/40" },
              { label: "Elliott Wave",    icon: "~",  fn: onAutoElliott,       color: "text-blue-400   hover:border-blue-400/40" },
            ].map(({ label, icon, fn, color }) => (
              <button
                key={label}
                onClick={() => { fn(); setStudiesOpen(false); }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-[var(--border)] transition-colors",
                  color
                )}
              >
                <span className="text-xs">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicators panel */}
      {indicatorsOpen && (
        <div className="absolute top-full left-0 right-0 z-20 bg-[var(--bg-card)] border-b border-[var(--border)] px-3 py-2.5 shadow-lg">
          <div className="flex flex-col gap-2">
            {INDICATOR_GROUPS.map((group) => (
              <div key={group.label} className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] w-24 shrink-0">{group.label}</span>
                <div className="flex flex-wrap gap-1">
                  {group.items.map(({ key, label, color }) => {
                    const active = indicators[key];
                    return (
                      <button
                        key={key}
                        onClick={() => onIndicatorChange(key, !active)}
                        style={active ? { borderColor: color, color } : undefined}
                        className={cn(
                          "px-2 py-0.5 rounded text-xs border transition-colors",
                          active
                            ? "bg-[var(--bg-page)]"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
