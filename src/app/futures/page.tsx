"use client";

import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketDirection } from "@/hooks/use-market-direction";
import type {
  CTAInstrumentSignal,
  CollarSignal,
  GammaFlipSignal,
  GammaWallLevel,
} from "@/lib/types";

// ─── Instrument config ────────────────────────────────────────────────────────

type CtaKey = "es" | "nq" | "gc";

interface InstrumentConfig {
  symbol: string;
  name: string;
  ctaKey: CtaKey | null;
  color: "blue" | "purple" | "amber" | "slate";
}

const INSTRUMENTS: InstrumentConfig[] = [
  { symbol: "ES=F", name: "E-mini S&P 500",    ctaKey: "es",   color: "blue"   },
  { symbol: "NQ=F", name: "E-mini NASDAQ-100", ctaKey: "nq",   color: "purple" },
  { symbol: "GC=F", name: "Gold",              ctaKey: "gc",   color: "amber"  },
  { symbol: "SI=F", name: "Silver",            ctaKey: null,   color: "slate"  },
];

// ─── Style helpers ────────────────────────────────────────────────────────────

type CtaLabel = "MAX_LONG" | "MAX_SHORT" | "LONG" | "SHORT" | "NEUTRAL";

const CTA_LABEL_STYLE: Record<CtaLabel, { text: string; bg: string; border: string }> = {
  MAX_LONG:  { text: "text-amber-300",   bg: "bg-amber-500/15",   border: "border-amber-500/30"   },
  MAX_SHORT: { text: "text-amber-300",   bg: "bg-amber-500/15",   border: "border-amber-500/30"   },
  LONG:      { text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  SHORT:     { text: "text-red-300",     bg: "bg-red-500/15",     border: "border-red-500/30"     },
  NEUTRAL:   { text: "text-slate-300",   bg: "bg-slate-500/15",   border: "border-slate-500/30"   },
};

const COLOR_ACCENT: Record<InstrumentConfig["color"], string> = {
  blue:   "text-blue-400",
  purple: "text-purple-400",
  amber:  "text-amber-400",
  slate:  "text-slate-400",
};

function fmtLevel(v: number | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number | undefined) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
      {children}
    </p>
  );
}

function CtaBadge({ label }: { label: string | undefined }) {
  const key = label ?? "NEUTRAL";
  const s = CTA_LABEL_STYLE[key as CtaLabel] ?? CTA_LABEL_STYLE["NEUTRAL"];
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", s.text, s.bg, s.border)}>
      {key.replace("_", " ")}
    </span>
  );
}

interface ScoreBarProps {
  score: number; // -1 to +1
}

function ScoreBar({ score }: ScoreBarProps) {
  const clampedScore = Math.max(-1, Math.min(1, score));
  const isPositive = clampedScore >= 0;
  const widthPct = Math.abs(clampedScore) * 50;

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-mono text-xs w-12 text-right", isPositive ? "text-emerald-400" : "text-red-400")}>
        {clampedScore >= 0 ? "+" : ""}{clampedScore.toFixed(2)}
      </span>
      <div className="relative flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        {/* center divider */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--text-muted)] z-10" />
        {isPositive ? (
          <div
            className="absolute inset-y-0 bg-emerald-500 rounded-r-full"
            style={{ left: "50%", width: `${widthPct}%` }}
          />
        ) : (
          <div
            className="absolute inset-y-0 bg-red-500 rounded-l-full"
            style={{ right: "50%", width: `${widthPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Activity className="w-8 h-8 text-[var(--text-muted)]" />
      <p className="text-sm text-[var(--text-muted)] max-w-xs">{message}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <div className="animate-pulse rounded bg-[var(--border)] h-6 w-20" />
          <div className="animate-pulse rounded bg-[var(--border)] h-3 w-32" />
        </div>
        <div className="animate-pulse rounded bg-[var(--border)] h-5 w-16" />
      </div>
      <div className="animate-pulse rounded bg-[var(--border)] h-2 w-full" />
      <div className="space-y-1">
        <div className="animate-pulse rounded bg-[var(--border)] h-3 w-3/4" />
        <div className="animate-pulse rounded bg-[var(--border)] h-3 w-1/2" />
      </div>
    </div>
  );
}

interface EsLevelsProps {
  gammaFlip: GammaFlipSignal;
  gammaWalls: GammaWallLevel[];
  collar: CollarSignal | undefined;
}

function EsLevels({ gammaFlip, gammaWalls, collar }: EsLevelsProps) {
  const topResistance = gammaWalls.find((w) => w.designation === "resistance");
  const topSupport = gammaWalls.find((w) => w.designation === "support");

  return (
    <div className="mt-3">
      <SectionLabel>Key Levels</SectionLabel>
      <div className="space-y-1">
        {gammaFlip.es_equivalent_stop != null && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Gamma Flip Stop</span>
            <span className="font-mono text-orange-400">{fmtLevel(gammaFlip.es_equivalent_stop)}</span>
          </div>
        )}
        {topResistance && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Top Gamma Wall (R)</span>
            <span className="font-mono text-red-400">{fmtLevel(topResistance.strike * 10)}</span>
          </div>
        )}
        {topSupport && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Gamma Wall (S)</span>
            <span className="font-mono text-emerald-400">{fmtLevel(topSupport.strike * 10)}</span>
          </div>
        )}
        {collar?.levels?.long_put && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">JPM Collar Floor</span>
            <span className="font-mono text-blue-400">{fmtLevel(collar.levels.long_put.strike)}</span>
          </div>
        )}
        {collar?.levels?.short_call && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">JPM Collar Cap</span>
            <span className="font-mono text-blue-400">{fmtLevel(collar.levels.short_call.strike)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface InstrumentCardProps {
  config: InstrumentConfig;
  cta: CTAInstrumentSignal | undefined;
  isEs: boolean;
  gammaFlip: GammaFlipSignal;
  gammaWalls: GammaWallLevel[];
  collar: CollarSignal | undefined;
}

function InstrumentCard({ config, cta, isEs, gammaFlip, gammaWalls, collar }: InstrumentCardProps) {
  const accentColor = COLOR_ACCENT[config.color];

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className={cn("font-mono text-xl font-bold", accentColor)}>{config.symbol}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{config.name}</p>
        </div>
        {cta ? (
          <CtaBadge label={cta.label} />
        ) : (
          <span className="text-[10px] text-[var(--text-muted)] italic">no CTA data</span>
        )}
      </div>

      {/* Positioning score bar */}
      {cta ? (
        <div>
          <SectionLabel>Positioning Score</SectionLabel>
          <ScoreBar score={cta.score} />
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)] italic py-1">awaiting CTA data</p>
      )}

      {/* Triggers */}
      {cta && (cta.next_sell_trigger || cta.next_buy_trigger) && (
        <div>
          <SectionLabel>Triggers</SectionLabel>
          <div className="space-y-1">
            {cta.next_sell_trigger && (
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-red-400">
                  <ArrowDown className="w-3 h-3" /> Sell
                </span>
                <span className="font-mono">
                  {fmtLevel(cta.next_sell_trigger.level)}{" "}
                  <span className="text-[var(--text-muted)]">({fmtPct(cta.next_sell_trigger.distance_pct)})</span>
                </span>
              </div>
            )}
            {cta.next_buy_trigger && (
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ArrowUp className="w-3 h-3" /> Buy
                </span>
                <span className="font-mono">
                  {fmtLevel(cta.next_buy_trigger.level)}{" "}
                  <span className="text-[var(--text-muted)]">({fmtPct(cta.next_buy_trigger.distance_pct)})</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ES-specific key levels */}
      {isEs && (
        <EsLevels gammaFlip={gammaFlip} gammaWalls={gammaWalls} collar={collar} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FuturesPage() {
  const { data, isPending, isError } = useMarketDirection();

  if (isPending) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="animate-pulse rounded bg-[var(--border)] h-7 w-40" />
          <div className="animate-pulse rounded bg-[var(--border)] h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INSTRUMENTS.map((inst) => <SkeletonCard key={inst.symbol} />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Futures Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">CTA positioning for ES, NQ, GC, SI</p>
        </div>
        <EmptyState message="Backend module not deployed — run /api/market/direction first" />
      </div>
    );
  }

  const cta = data.cta;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Futures Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            CTA positioning for ES, NQ, GC, SI
            {data.as_of && (
              <span className="ml-2 text-[var(--text-muted)]">· as of {data.as_of}</span>
            )}
          </p>
        </div>
        {cta && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold",
            cta.risk_on_off === "RISK_ON"
              ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25"
              : cta.risk_on_off === "RISK_OFF"
              ? "text-red-300 bg-red-500/10 border-red-500/25"
              : "text-slate-300 bg-slate-500/10 border-slate-500/25"
          )}>
            {cta.risk_on_off === "RISK_ON" ? (
              <TrendingUp className="w-4 h-4" />
            ) : cta.risk_on_off === "RISK_OFF" ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Gauge className="w-4 h-4" />
            )}
            {cta.risk_on_off?.replace("_", " ")}
          </div>
        )}
      </div>

      {/* Summary bar if CTA available */}
      {cta && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <SectionLabel>Equity Bias</SectionLabel>
          <ScoreBar score={cta.aggregate_equity_bias} />
        </div>
      )}

      {/* Instrument grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INSTRUMENTS.map((inst) => {
          const ctaData = inst.ctaKey ? cta?.[inst.ctaKey] : undefined;
          return (
            <InstrumentCard
              key={inst.symbol}
              config={inst}
              cta={ctaData}
              isEs={inst.ctaKey === "es"}
              gammaFlip={data.gamma_flip}
              gammaWalls={data.gamma_walls ?? []}
              collar={data.jpm_collar}
            />
          );
        })}
      </div>

      {/* CTA alerts */}
      {cta?.alerts && cta.alerts.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
          <SectionLabel>Alerts</SectionLabel>
          {cta.alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="font-mono text-[var(--text-muted)] text-xs mr-2">{alert.instrument}</span>
              <span className="text-[var(--text-primary)] flex-1">{alert.message}</span>
              <span className="font-mono text-xs text-amber-400 shrink-0">{fmtPct(alert.distance_pct)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
