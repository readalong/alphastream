"use client";

import { useSessions } from "@/hooks/use-sessions";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { VixAnalysis } from "@/lib/types";
import { Activity, TrendingDown, TrendingUp, Minus, Shield, Target, Crosshair } from "lucide-react";

const FEAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Low:      { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/25" },
  Elevated: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25" },
  High:     { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/25" },
  Extreme:  { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/25" },
};

const REGIME_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Risk-On":  { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/25" },
  "Neutral":  { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/25" },
  "Risk-Off": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/25" },
  "Crisis":   { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/25" },
};

function VixGaugeBar({ level }: { level: number }) {
  // Map VIX 0-50+ to percentage for the gauge
  const pct = Math.min((level / 50) * 100, 100);
  const color = level < 15 ? "#22c55e" : level < 20 ? "#22c55e" : level < 30 ? "#f59e0b" : level < 40 ? "#f97316" : "#ef4444";

  return (
    <div className="relative h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
      {/* Tick marks */}
      <div className="absolute inset-0 flex">
        {[15, 20, 30, 40].map((tick) => (
          <div
            key={tick}
            className="absolute top-0 bottom-0 w-px bg-[var(--text-muted)]/20"
            style={{ left: `${(tick / 50) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ImplicationItem({ icon: Icon, label, value, variant }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  variant: "green" | "amber" | "red";
}) {
  const colors = {
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-[var(--bg-primary)] px-3 py-2.5">
      <Icon className={`h-4 w-4 ${colors[variant]} shrink-0`} />
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium ${colors[variant]}`}>{value}</p>
      </div>
    </div>
  );
}

function getImplicationVariant(label: string, value: string): "green" | "amber" | "red" {
  if (label === "Position Sizing") return value === "Full" ? "green" : value === "Reduced" ? "amber" : "red";
  if (label === "Hedging") return value === "None" ? "green" : value === "Consider" ? "amber" : "red";
  // Opportunity type
  if (value === "Breakout entries") return "green";
  if (value === "Buy the dip") return "amber";
  return "red";
}

export function VixFearGauge() {
  const { data: sessions } = useSessions();
  const aiSession = sessions?.find((s) => s.has_ai_analysis);

  const { data: report } = useQuery({
    queryKey: ["session-report", aiSession?.session_id],
    queryFn: () => api.sessionReport(aiSession!.session_id),
    enabled: !!aiSession,
    staleTime: 30 * 60 * 1000,
  });

  const vix: VixAnalysis | null | undefined = report?.vix_analysis;
  if (!vix) return null;

  const fearStyle = FEAR_COLORS[vix.fear_level] ?? FEAR_COLORS.Low;
  const regimeStyle = REGIME_COLORS[vix.regime_signal] ?? REGIME_COLORS.Neutral;
  const changeColor = vix.daily_change_pct < 0 ? "text-green-400" : vix.daily_change_pct > 0 ? "text-red-400" : "text-[var(--text-muted)]";
  const TrendIcon = vix.trend_direction === "Falling" ? TrendingDown : vix.trend_direction === "Rising" ? TrendingUp : Minus;

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            VIX Fear Gauge
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${fearStyle.bg} ${fearStyle.text} border ${fearStyle.border}`}>
            {vix.fear_level}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${regimeStyle.bg} ${regimeStyle.text} border ${regimeStyle.border}`}>
            {vix.regime_signal}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* VIX Level + Change */}
        <div className="flex items-end gap-4">
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">VIX Level</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
              {vix.current_level.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            <TrendIcon className={`h-4 w-4 ${changeColor}`} />
            <span className={`text-sm font-semibold tabular-nums ${changeColor}`}>
              {vix.daily_change_pct > 0 ? "+" : ""}{vix.daily_change_pct.toFixed(1)}%
            </span>
            <span className="text-xs text-[var(--text-muted)]">{vix.trend_direction}</span>
          </div>
        </div>

        {/* Gauge bar */}
        <div>
          <VixGaugeBar level={vix.current_level} />
          <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
            <span>0</span>
            <span>15</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span>50+</span>
          </div>
        </div>

        {/* Commentary */}
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {vix.commentary}
        </p>

        {/* Implications grid */}
        <div className="grid grid-cols-3 gap-2">
          <ImplicationItem
            icon={Target}
            label="Position Sizing"
            value={vix.implications.position_sizing}
            variant={getImplicationVariant("Position Sizing", vix.implications.position_sizing)}
          />
          <ImplicationItem
            icon={Shield}
            label="Hedging"
            value={vix.implications.hedging_urgency}
            variant={getImplicationVariant("Hedging", vix.implications.hedging_urgency)}
          />
          <ImplicationItem
            icon={Crosshair}
            label="Opportunity"
            value={vix.implications.opportunity_type}
            variant={getImplicationVariant("Opportunity", vix.implications.opportunity_type)}
          />
        </div>
      </div>
    </section>
  );
}
