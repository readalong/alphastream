"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketDirection } from "@/hooks/use-market-direction";
import type {
  SignalColor,
  VixSignal,
  StrategyModeSignal,
  GexSignal,
  GammaFlipSignal,
  GammaWallLevel,
  CollarSignal,
  CTASignal,
  MarketWarning,
} from "@/lib/types";

// ─── Color maps ───────────────────────────────────────────────────────────────

const COLOR: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  green:  { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  amber:  { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400"   },
  yellow: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400"   },
  orange: { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/25",  dot: "bg-orange-400"  },
  red:    { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25",     dot: "bg-red-400"     },
  gray:   { text: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/20",   dot: "bg-slate-400"   },
};

const WARN_SEVERITY: Record<string, string> = {
  LOW:      "text-slate-400",
  MEDIUM:   "text-amber-400",
  HIGH:     "text-red-400",
  CRITICAL: "text-red-300",
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function Sep() {
  return <div className="h-3.5 w-px bg-[var(--border)] shrink-0 mx-0.5" />;
}

function Badge({
  color,
  label,
  value,
  sub,
  pulse,
}: {
  color: SignalColor;
  label: string;
  value: string;
  sub?: string;
  pulse?: boolean;
}) {
  const c = COLOR[color] ?? COLOR["gray"];
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] leading-none", c.bg, c.border)}>
      {pulse && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 animate-pulse", c.dot)} />}
      <span className="text-[var(--text-muted)] font-medium uppercase tracking-wider">{label}</span>
      <span className={cn("font-mono font-semibold", c.text)}>{value}</span>
      {sub && <span className={cn("font-mono opacity-70", c.text)}>{sub}</span>}
    </div>
  );
}

function PricePill({ price, changePct }: { price: number; changePct?: number }) {
  const up = (changePct ?? 0) >= 0;
  const priceStr = typeof price === "number" ? price.toFixed(2) : "—";
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider">SPY</span>
      <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">{priceStr}</span>
      {changePct != null && typeof changePct === "number" && (
        <span className={cn("font-mono text-[10px] font-medium", up ? "text-emerald-400" : "text-red-400")}>
          {up ? "+" : ""}{changePct.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

// ─── Row 1 widgets ────────────────────────────────────────────────────────────

function VixWidget({ v }: { v: VixSignal }) {
  const slopeChar = v.slope === "RISING" ? "↗" : v.slope === "FALLING" ? "↘" : "→";
  const level = typeof v.level === "number" ? v.level.toFixed(1) : "—";
  return (
    <Badge
      color={v.color ?? "gray"}
      label="VIX"
      value={`${level} ${v.regime ?? ""}`}
      sub={slopeChar}
    />
  );
}

function ModeWidget({ m }: { m: StrategyModeSignal }) {
  // Show the base mode label compactly
  const label = m.base.replace("_", " ");
  return <Badge color={m.color} label="MODE" value={label} />;
}

function AllocWidget({ a }: { a: { long: number; short: number; hedge: number; cash: number } }) {
  return (
    <div className="inline-flex items-center gap-1 text-[10px] font-mono">
      <span className="text-[var(--text-muted)] uppercase tracking-wider font-medium">ALLOC</span>
      <span className="text-emerald-400">{a.long}L</span>
      <span className="text-[var(--border)]">/</span>
      <span className="text-red-400">{a.short}S</span>
      <span className="text-[var(--border)]">/</span>
      <span className="text-amber-400">{a.hedge}H</span>
      <span className="text-[var(--border)]">/</span>
      <span className="text-slate-400">{a.cash}C</span>
    </div>
  );
}

// ─── Row 2 widgets ────────────────────────────────────────────────────────────

function GexWidget({ g }: { g: GexSignal }) {
  const sign = g.regime === "POSITIVE_GAMMA" ? "+" : g.regime === "NEGATIVE_GAMMA" ? "−" : "~";
  return (
    <Badge
      color={g.color}
      label="GEX"
      value={`${sign}GAMMA`}
      sub={g.magnitude}
      pulse={g.regime === "NEGATIVE_GAMMA"}
    />
  );
}

function FlipWidget({ f }: { f: GammaFlipSignal }) {
  const arrow = f.above_flip ? "↑" : "↓";
  const pct = typeof f.distance_pct === "number" ? f.distance_pct : 0;
  const dist = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  return (
    <Badge
      color={f.color ?? "gray"}
      label="FLIP"
      value={f.strike != null ? `${f.strike}` : "—"}
      sub={`${dist}${arrow}`}
      pulse={f.near_flip}
    />
  );
}

function WallsWidget({ walls }: { walls: GammaWallLevel[] }) {
  if (!walls.length) return null;
  // Show top 3, sorted by strength then OI
  const top = walls.slice(0, 3);
  return (
    <div className="inline-flex items-center gap-1 text-[10px] font-mono">
      <span className="text-[var(--text-muted)] uppercase tracking-wider font-medium">WALLS</span>
      {top.map((w, i) => (
        <span key={i} className={cn(w.designation === "resistance" ? "text-red-400" : "text-emerald-400")}>
          {w.strike}{i < top.length - 1 ? <span className="text-[var(--border)]">/</span> : null}
        </span>
      ))}
    </div>
  );
}

function CollarWidget({ c }: { c: CollarSignal }) {
  const posLabel: Record<string, string> = {
    near_floor: "NEAR FLOOR",
    mid_range:  "MID RANGE",
    near_cap:   "NEAR CAP",
  };
  const pulse = c.floor_breach_risk || c.reset_warning;
  return (
    <Badge
      color={c.color}
      label="COLLAR"
      value={posLabel[c.position_in_collar] ?? c.position_in_collar}
      sub={`${c.days_until_reset}d`}
      pulse={pulse}
    />
  );
}

function CTAWidget({ c }: { c: CTASignal }) {
  const esBias = c.es?.label ?? (c.risk_on_off === "RISK_ON" ? "LONG" : c.risk_on_off === "RISK_OFF" ? "SHORT" : "NEUTRAL");
  const score = typeof c.aggregate_equity_bias === "number"
    ? c.aggregate_equity_bias.toFixed(2)
    : "";
  const color: SignalColor =
    c.es?.max_position || c.nq?.max_position ? "amber"
    : c.risk_on_off === "RISK_ON" ? "green"
    : c.risk_on_off === "RISK_OFF" ? "red"
    : "gray";
  return (
    <Badge
      color={color}
      label="CTA"
      value={`ES ${esBias}`}
      sub={score}
      pulse={c.es?.max_position || c.nq?.max_position}
    />
  );
}

function WarningsWidget({ warnings }: { warnings: MarketWarning[] }) {
  if (!warnings.length) return null;
  const highest = warnings.reduce((acc, w) => {
    const order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    return order.indexOf(w.severity) > order.indexOf(acc.severity) ? w : acc;
  }, warnings[0]);
  return (
    <div
      className={cn("inline-flex items-center gap-1 text-[10px] font-medium", WARN_SEVERITY[highest.severity])}
      title={warnings.map((w) => `${w.type} (${w.severity})`).join(" · ")}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>{warnings.length}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StripSkeleton() {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-0">
      <div className="flex items-center gap-3 h-7">
        {[80, 120, 100, 100].map((w, i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-[var(--border)] h-4"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 h-7">
        {[90, 110, 120, 90, 90].map((w, i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-[var(--border)] h-4"
            style={{ width: w }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketDirectionStrip() {
  const { data, isError, isPending, dataUpdatedAt, refetch, isFetching } = useMarketDirection();

  // Backend module not deployed yet — render nothing rather than an error bar
  if (isError) return null;
  if (isPending) return <StripSkeleton />;
  if (!data) return null;

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-card)] px-4 shrink-0">

      {/* ── Row 1: Price · Regime fundamentals ──────────────────────────── */}
      <div className="flex items-center gap-3 h-7 overflow-x-auto scrollbar-none">
        {data.spy_spot != null && <PricePill price={data.spy_spot} changePct={data.spy_change_pct} />}
        {data.vix && <><Sep /><VixWidget v={data.vix} /></>}
        {data.strategy_mode && <><Sep /><ModeWidget m={data.strategy_mode} /></>}
        {data.allocation && <><Sep /><AllocWidget a={data.allocation} /></>}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {lastUpdate && (
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{lastUpdate} ET</span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Row 2: Market structure signals ──────────────────────────────── */}
      <div className="flex items-center gap-2 h-7 overflow-x-auto scrollbar-none pb-0.5">
        {data.gex && <GexWidget g={data.gex} />}
        {data.gamma_flip && <FlipWidget f={data.gamma_flip} />}
        {data.gamma_walls && data.gamma_walls.length > 0 && (
          <>
            <Sep />
            <WallsWidget walls={data.gamma_walls} />
          </>
        )}
        <div className="flex-1 min-w-2" />
        {data.jpm_collar && <CollarWidget c={data.jpm_collar} />}
        {data.cta && <CTAWidget c={data.cta} />}
        {data.warnings && data.warnings.length > 0 && (
          <>
            <Sep />
            <WarningsWidget warnings={data.warnings} />
          </>
        )}
      </div>
    </div>
  );
}
