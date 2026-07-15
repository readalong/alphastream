"use client";

import { useSessions } from "@/hooks/use-sessions";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { VixAnalysis } from "@/lib/types";
import { Activity, TrendingDown, TrendingUp, Minus, Shield, Target, Crosshair } from "lucide-react";

const FEAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Low:      { bg: "bg-[var(--long)]/10", text: "text-[var(--long)]", border: "border-[var(--long)]/25" },
  Elevated: { bg: "bg-[var(--caution)]/10", text: "text-[var(--caution)]", border: "border-[var(--caution)]/25" },
  High:     { bg: "bg-[var(--severe)]/10", text: "text-[var(--severe)]", border: "border-[var(--severe)]/25" },
  Extreme:  { bg: "bg-[var(--short)]/10", text: "text-[var(--short)]", border: "border-[var(--short)]/25" },
};

const REGIME_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Risk-On":  { bg: "bg-[var(--long)]/10", text: "text-[var(--long)]", border: "border-[var(--long)]/25" },
  "Neutral":  { bg: "bg-[var(--info)]/10", text: "text-[var(--info)]", border: "border-[var(--info)]/25" },
  "Risk-Off": { bg: "bg-[var(--severe)]/10", text: "text-[var(--severe)]", border: "border-[var(--severe)]/25" },
  "Crisis":   { bg: "bg-[var(--short)]/10", text: "text-[var(--short)]", border: "border-[var(--short)]/25" },
};

function VixGaugeBar({ level }: { level: number }) {
  // Map VIX 0-50+ to percentage for the gauge
  const pct = Math.min((level / 50) * 100, 100);
  const color = level < 20 ? "var(--long)" : level < 30 ? "var(--caution)" : level < 40 ? "var(--severe)" : "var(--short)";

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
    green: "text-[var(--long)]",
    amber: "text-[var(--caution)]",
    red: "text-[var(--short)]",
  };
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-[var(--bg-primary)] px-3 py-2.5">
      <Icon className={`h-4 w-4 ${colors[variant]} shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
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
  const changeColor = vix.daily_change_pct < 0 ? "text-[var(--long)]" : vix.daily_change_pct > 0 ? "text-[var(--short)]" : "text-[var(--text-muted)]";
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
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${fearStyle.bg} ${fearStyle.text} border ${fearStyle.border}`}>
            {vix.fear_level}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${regimeStyle.bg} ${regimeStyle.text} border ${regimeStyle.border}`}>
            {vix.regime_signal}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* VIX Level + Change */}
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">VIX Level</p>
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
          <div className="flex justify-between mt-1 text-xs text-[var(--text-muted)]">
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
