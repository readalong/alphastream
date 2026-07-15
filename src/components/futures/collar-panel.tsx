"use client";

import {
  Shield,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollarActive } from "@/hooks/use-collar";
import { useMarketDirection } from "@/hooks/use-market-direction";
import type { CollarActiveResponse, SisterFund } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLevel(v: number | undefined) {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number | undefined) {
  if (v == null || isNaN(v)) return "—";
  return `${v >= 0 ? "" : ""}${v.toFixed(2)}%`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[var(--text-muted)] mb-2">
      {children}
    </p>
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

// ─── Position Visualizer ──────────────────────────────────────────────────────

interface CollarVisualizerProps {
  longPutSpy: number | undefined;
  shortCallSpy: number | undefined;
  currentSpy: number | undefined;
}

function CollarVisualizer({ longPutSpy, shortCallSpy, currentSpy }: CollarVisualizerProps) {
  const range = (shortCallSpy ?? 0) - (longPutSpy ?? 0);
  const positionPct =
    currentSpy != null && longPutSpy != null && range > 0
      ? Math.max(0, Math.min(100, ((currentSpy - longPutSpy) / range) * 100))
      : null;

  return (
    <div className="space-y-2">
      <SectionLabel>Price Position in Collar</SectionLabel>
      <div className="relative h-10 overflow-hidden border border-[var(--border)]">
        {/* danger zone left */}
        <div className="absolute inset-y-0 left-0 w-[20%] bg-[var(--short)]/10" />
        {/* safe zone */}
        <div className="absolute inset-y-0 left-[20%] right-[20%] bg-[var(--long)]/5" />
        {/* cap zone right */}
        <div className="absolute inset-y-0 right-0 w-[20%] bg-[var(--short)]/10" />

        {/* SPY price marker */}
        {positionPct != null && (
          <div
            className="absolute inset-y-0 w-0.5 bg-[var(--text-primary)]/80 z-10"
            style={{ left: `${positionPct}%` }}
          >
            <span
              className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-xs text-[var(--text-primary)] whitespace-nowrap"
              style={{ top: "-1.25rem" }}
            >
              SPY {fmtLevel(currentSpy)}
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-[var(--short)]">Floor {fmtLevel(longPutSpy)}</span>
        <span className="text-[var(--short)]">Cap {fmtLevel(shortCallSpy)}</span>
      </div>
    </div>
  );
}

// ─── Strike Level Card ────────────────────────────────────────────────────────

interface StrikeLevelCardProps {
  label: string;
  description: string;
  strike: number | undefined;
  spy: number | undefined;
  distancePct: number | undefined;
  accentClass: string;
}

function StrikeLevelCard({ label, description, strike, spy, distancePct, accentClass }: StrikeLevelCardProps) {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Shield className={cn("w-3.5 h-3.5", accentClass)} />
        <span className={cn("text-xs font-semibold", accentClass)}>{label}</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3">{description}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">SPX strike</span>
          <span className={cn("font-mono", accentClass)}>{fmtLevel(strike)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">SPY equiv.</span>
          <span className="font-mono text-[var(--text-primary)]">{fmtLevel(spy)}</span>
        </div>
        {distancePct != null && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Distance</span>
            <span className={cn("font-mono", distancePct < 0 ? "text-[var(--short)]" : "text-[var(--long)]")}>
              {fmtPct(distancePct)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sister Funds Table ───────────────────────────────────────────────────────

function SisterFundsTable({ funds, activeFund }: { funds: SisterFund[]; activeFund: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <SectionLabel>Sister funds (quarterly rotation)</SectionLabel>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Fund</th>
            <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Reset date</th>
            <th className="px-4 py-2 text-right text-[var(--text-muted)] font-normal">Days</th>
            <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((f) => (
            <tr
              key={f.fund}
              className={cn(
                "border-b border-[var(--border)] last:border-0",
                f.fund === activeFund ? "bg-[var(--info)]/5" : ""
              )}
            >
              <td className="px-4 py-2 font-mono font-semibold text-[var(--text-primary)]">
                {f.fund}
                {f.fund === activeFund && (
                  <span className="ml-1.5 text-xs text-[var(--info)]">active</span>
                )}
              </td>
              <td className="px-4 py-2 font-mono text-[var(--text-muted)]">{f.reset_date}</td>
              <td className="px-4 py-2 font-mono text-right text-[var(--text-primary)]">{f.days}</td>
              <td className="px-4 py-2 text-[var(--text-muted)]">{f.status ?? (f.active ? "Active" : "Pending")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main collar display ──────────────────────────────────────────────────────

interface CollarDisplayProps {
  collar: CollarActiveResponse;
}

function CollarDisplay({ collar }: CollarDisplayProps) {
  const cl = collar.collar_levels;
  if (!cl) return <CollarFallbackDisplay />;
  const spy = cl.spy_equivalent;
  // Resolve strikes — backend may use long_put_strike OR long_put (both patterns seen)
  const longPutStrike   = cl.long_put_strike   ?? cl.long_put;
  const shortCallStrike = cl.short_call_strike ?? cl.short_call;
  const shortPutStrike  = cl.short_put_strike  ?? cl.short_put;
  // SPY ≈ SPX / 10 as fallback when backend hasn't computed spy_equivalent yet
  const longPutSpy   = spy?.long_put   ?? (longPutStrike   != null ? longPutStrike   / 10 : undefined);
  const shortCallSpy = spy?.short_call ?? (shortCallStrike != null ? shortCallStrike / 10 : undefined);
  const shortPutSpy  = spy?.short_put  ?? (shortPutStrike  != null ? shortPutStrike  / 10 : undefined);
  const isWarning =
    collar.days_until_reset <= 5 ||
    (collar.reset_warning != null && collar.reset_warning !== false && collar.reset_warning !== "");

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[var(--info)]" />
              <span className="text-xs text-[var(--text-muted)]">Active fund</span>
            </div>
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{collar.active_fund}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Reset: <span className="font-mono text-[var(--text-primary)]">{collar.reset_date}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-1">Days until reset</p>
            <p className={cn(
              "font-mono text-4xl font-bold",
              collar.days_until_reset <= 5 ? "text-[var(--short)]" : collar.days_until_reset <= 14 ? "text-[var(--caution)]" : "text-[var(--text-primary)]"
            )}>
              {collar.days_until_reset}
            </p>
          </div>
        </div>

        {isWarning && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-[var(--caution)]/10 border border-[var(--caution)]/25 text-[var(--caution)] text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {typeof collar.reset_warning === "string" && collar.reset_warning
                ? collar.reset_warning
                : "Reset approaching — expect potential pinning / increased collar influence"}
            </span>
          </div>
        )}

        {(collar.data_source || collar.last_updated) && (
          <p className="text-xs text-[var(--text-muted)] mt-3">
            {collar.data_source && <>Source: {collar.data_source}</>}
            {collar.data_source && collar.last_updated && <> · </>}
            {collar.last_updated && <>Updated: {collar.last_updated}</>}
          </p>
        )}
      </div>

      {/* Position visualizer */}
      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <CollarVisualizer
          longPutSpy={longPutSpy}
          shortCallSpy={shortCallSpy}
          currentSpy={collar.current_spy}
        />
        {collar.position_in_collar && (
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Position:{" "}
            <span className={cn(
              "font-semibold",
              collar.position_in_collar === "near_floor" ? "text-[var(--short)]" :
              collar.position_in_collar === "near_cap"   ? "text-[var(--caution)]" :
              "text-[var(--long)]"
            )}>
              {collar.position_in_collar.replace("_", " ")}
            </span>
            {collar.distance_to_floor_pct != null && (
              <span className="ml-2 font-mono text-[var(--text-muted)]">
                Floor: {fmtPct(collar.distance_to_floor_pct)} away
              </span>
            )}
            {collar.distance_to_cap_pct != null && (
              <span className="ml-2 font-mono text-[var(--text-muted)]">
                Cap: {fmtPct(collar.distance_to_cap_pct)} away
              </span>
            )}
          </p>
        )}
      </div>

      {/* Strike level cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StrikeLevelCard
          label="Long put — floor"
          description="Downside protection. Major support — dealers hedge below here."
          strike={longPutStrike}
          spy={longPutSpy}
          distancePct={collar.distance_to_floor_pct != null ? -Math.abs(collar.distance_to_floor_pct) : undefined}
          accentClass="text-[var(--short)]"
        />
        {shortPutStrike != null && (
          <StrikeLevelCard
            label="Short put — funding"
            description="Collar funding leg. Moderate support zone."
            strike={shortPutStrike}
            spy={shortPutSpy}
            distancePct={undefined}
            accentClass="text-[var(--severe)]"
          />
        )}
        <StrikeLevelCard
          label="Short call — cap"
          description="Upside cap. Resistance — dealers sell above here."
          strike={shortCallStrike}
          spy={shortCallSpy}
          distancePct={collar.distance_to_cap_pct}
          accentClass="text-[var(--caution)]"
        />
      </div>

      {/* Sister funds */}
      {collar.sister_funds && collar.sister_funds.length > 0 && (
        <SisterFundsTable funds={collar.sister_funds} activeFund={collar.active_fund} />
      )}

      {/* About JHEQX */}
      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <SectionLabel>About the JPM Hedged Equity Collar (JHEQX)</SectionLabel>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          JHEQX is a $22B+ S&P 500 options collar reset quarterly (March, June, September, December).
          The fund buys a long put (floor) and funds it by selling a short put and a short call (cap).
          Because of the fund&apos;s enormous notional size, the strike levels act as significant dealer
          gamma anchors — dealers must buy near the floor and sell near the cap to hedge their exposure,
          creating self-reinforcing support and resistance. As reset approaches, price tends to pin near
          these levels due to gamma pressure.
        </p>
      </div>
    </div>
  );
}

// ─── Fallback display using market-direction data ─────────────────────────────

function CollarFallbackDisplay() {
  const { data, isPending } = useMarketDirection();

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--border)] h-20 w-full" />
        ))}
      </div>
    );
  }

  const collar = data?.jpm_collar;
  if (!collar) {
    return <EmptyState message="Backend module not deployed — run /api/market/direction first" />;
  }

  const cl = collar.collar_levels;
  if (!cl) {
    return (
      <EmptyState message={`${collar.active_fund} collar not yet configured for this reset — no strikes entered. Run POST /api/collar/update after the next quarterly reset.`} />
    );
  }

  const spy = cl.spy_equivalent;
  // Resolve strikes — backend may use long_put_strike OR long_put (both patterns seen)
  const longPutStrike   = cl.long_put_strike   ?? cl.long_put;
  const shortCallStrike = cl.short_call_strike ?? cl.short_call;
  // SPY ≈ SPX / 10 as fallback when backend hasn't computed spy_equivalent yet
  const longPutSpy   = spy?.long_put   ?? (longPutStrike   != null ? longPutStrike   / 10 : undefined);
  const shortCallSpy = spy?.short_call ?? (shortCallStrike != null ? shortCallStrike / 10 : undefined);
  const distancePct = (strike: number | undefined, spyLevel: number | undefined) =>
    strike != null && spyLevel != null && collar.current_spy != null
      ? ((spyLevel - collar.current_spy) / collar.current_spy) * 100
      : undefined;

  const isWarning = collar.reset_warning || collar.days_until_reset <= 5;

  return (
    <div className="space-y-6">
      <div className="border border-[var(--caution)]/25 bg-[var(--caution)]/5 p-3 text-xs text-[var(--caution)]">
        Showing fallback data from /api/market/direction. Deploy the collar module for full data.
      </div>

      {/* Header card */}
      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[var(--info)]" />
              <span className="text-xs text-[var(--text-muted)]">Active fund</span>
            </div>
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{collar.active_fund}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Reset: <span className="font-mono text-[var(--text-primary)]">{collar.reset_date}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-1">Days until reset</p>
            <p className={cn(
              "font-mono text-4xl font-bold",
              collar.days_until_reset <= 5 ? "text-[var(--short)]" : collar.days_until_reset <= 14 ? "text-[var(--caution)]" : "text-[var(--text-primary)]"
            )}>
              {collar.days_until_reset}
            </p>
          </div>
        </div>
        {isWarning && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-[var(--caution)]/10 border border-[var(--caution)]/25 text-[var(--caution)] text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Reset approaching — expect potential pinning / increased collar influence</span>
          </div>
        )}
      </div>

      {/* Strike levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StrikeLevelCard
          label="Long put — floor"
          description="Downside protection."
          strike={longPutStrike}
          spy={longPutSpy}
          distancePct={distancePct(longPutStrike, longPutSpy)}
          accentClass="text-[var(--short)]"
        />
        <StrikeLevelCard
          label="Short call — cap"
          description="Upside cap."
          strike={shortCallStrike}
          spy={shortCallSpy}
          distancePct={distancePct(shortCallStrike, shortCallSpy)}
          accentClass="text-[var(--caution)]"
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CollarPanel() {
  const { data: collarData, isPending, isError } = useCollarActive();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">JPM Collar</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          JHEQX quarterly options collar levels — floor &amp; cap support/resistance for ES
        </p>
      </div>

      {isPending ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--border)] h-24 w-full" />
          ))}
        </div>
      ) : isError || !collarData || !collarData.collar_levels ? (
        <CollarFallbackDisplay />
      ) : (
        <CollarDisplay collar={collarData} />
      )}
    </section>
  );
}
