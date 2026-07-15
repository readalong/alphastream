"use client";

import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCTAAll } from "@/hooks/use-cta";
import { useMarketDirection } from "@/hooks/use-market-direction";
import type { CTAInstrumentFull, CTAAggregate, CTAAlert, CTASignal } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLevel(v: number | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number | undefined) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtScore(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

type CtaLabel = "MAX_LONG" | "MAX_SHORT" | "LONG" | "SHORT" | "NEUTRAL";

const CTA_LABEL_STYLE: Record<CtaLabel, { text: string; bg: string; border: string }> = {
  MAX_LONG:  { text: "text-[var(--caution)]", bg: "bg-[var(--caution)]/15", border: "border-[var(--caution)]/30" },
  MAX_SHORT: { text: "text-[var(--caution)]", bg: "bg-[var(--caution)]/15", border: "border-[var(--caution)]/30" },
  LONG:      { text: "text-[var(--long)]",    bg: "bg-[var(--long)]/15",    border: "border-[var(--long)]/30"    },
  SHORT:     { text: "text-[var(--short)]",   bg: "bg-[var(--short)]/15",   border: "border-[var(--short)]/30"   },
  NEUTRAL:   { text: "text-[var(--text-muted)]", bg: "bg-[var(--bg-primary)]", border: "border-[var(--border)]" },
};

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

function CtaBadge({ label }: { label: string | undefined }) {
  const key = label ?? "NEUTRAL";
  const s = CTA_LABEL_STYLE[key as CtaLabel] ?? CTA_LABEL_STYLE["NEUTRAL"];
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", s.text, s.bg, s.border)}>
      {key.replace("_", " ")}
    </span>
  );
}

// ─── Centered score bar ───────────────────────────────────────────────────────

interface ScoreBarProps {
  score: number; // -1 to +1
  compact?: boolean;
}

function ScoreBar({ score, compact = false }: ScoreBarProps) {
  const clamped = Math.max(-1, Math.min(1, score));
  const isPositive = clamped >= 0;
  const widthPct = Math.abs(clamped) * 50;
  const h = compact ? "h-1.5" : "h-2";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-mono text-xs w-12 text-right shrink-0", isPositive ? "text-[var(--long)]" : "text-[var(--short)]")}>
        {fmtScore(clamped)}
      </span>
      <div className={cn("relative flex-1 rounded-full bg-[var(--border)] overflow-hidden", h)}>
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--text-muted)] z-10" />
        {isPositive ? (
          <div
            className="absolute inset-y-0 bg-[var(--long)] rounded-r-full"
            style={{ left: "50%", width: `${widthPct}%` }}
          />
        ) : (
          <div
            className="absolute inset-y-0 bg-[var(--short)] rounded-l-full"
            style={{ right: "50%", width: `${widthPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Aggregate bias card ──────────────────────────────────────────────────────

interface BiasCardProps {
  label: string;
  score: number;
  note?: string;
}

function BiasCard({ label, score, note }: BiasCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <SectionLabel>{label}</SectionLabel>
      <ScoreBar score={score} />
      {note && <p className="text-xs text-[var(--text-muted)] mt-2">{note}</p>}
    </div>
  );
}

// ─── Per-instrument table ─────────────────────────────────────────────────────

interface InstrumentTableProps {
  instruments: CTAInstrumentFull[];
}

function InstrumentTable({ instruments }: InstrumentTableProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <SectionLabel>Per-Instrument Positioning</SectionLabel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Symbol</th>
              <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal min-w-[160px]">Score</th>
              <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Label</th>
              <th className="px-4 py-2 text-right text-[var(--text-muted)] font-normal">Next Sell</th>
              <th className="px-4 py-2 text-right text-[var(--text-muted)] font-normal">Next Buy</th>
              <th className="px-4 py-2 text-right text-[var(--text-muted)] font-normal">Flip Age</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((inst) => (
              <tr key={inst.symbol} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover,rgba(255,255,255,0.03))]">
                <td className="px-4 py-2.5 font-mono font-semibold text-[var(--text-primary)]">{inst.symbol}</td>
                <td className="px-4 py-2.5 min-w-[160px]">
                  <ScoreBar score={inst.positioning_score} compact />
                </td>
                <td className="px-4 py-2.5">
                  <CtaBadge label={inst.positioning_label} />
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {inst.next_sell_trigger ? (
                    <span className="flex flex-col items-end">
                      <span className="text-[var(--short)]">{fmtLevel(inst.next_sell_trigger.level)}</span>
                      <span className="text-[var(--text-muted)] text-xs">{fmtPct(inst.next_sell_trigger.distance_pct)}</span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {inst.next_buy_trigger ? (
                    <span className="flex flex-col items-end">
                      <span className="text-[var(--long)]">{fmtLevel(inst.next_buy_trigger.level)}</span>
                      <span className="text-[var(--text-muted)] text-xs">{fmtPct(inst.next_buy_trigger.distance_pct)}</span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[var(--text-muted)]">
                  {inst.days_since_flip != null ? `${inst.days_since_flip}d` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Alerts feed ──────────────────────────────────────────────────────────────

function AlertsFeed({ alerts }: { alerts: CTAAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
      <SectionLabel>Alerts</SectionLabel>
      {alerts.map((alert, i) => (
        <div key={i} className="flex items-start gap-3 text-sm py-1.5 border-b border-[var(--border)] last:border-0">
          <AlertTriangle className="w-4 h-4 text-[var(--caution)] mt-0.5 shrink-0" />
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-primary)] shrink-0">
            {alert.instrument}
          </span>
          <span className="text-[var(--text-primary)] flex-1 text-xs">{alert.message}</span>
          <span className="font-mono text-xs text-[var(--caution)] shrink-0">{fmtPct(alert.distance_pct)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Full CTA display ─────────────────────────────────────────────────────────

interface CtaFullDisplayProps {
  aggregate: CTAAggregate;
  instruments: CTAInstrumentFull[];
  alerts: CTAAlert[];
  asOfDate: string;
  dataSource?: string;
  lastUpdated?: string;
}

function CtaFullDisplay({ aggregate, instruments, alerts, asOfDate, dataSource, lastUpdated }: CtaFullDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Aggregate biases + risk badge */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Aggregate Biases</h2>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold",
            aggregate.risk_on_off === "RISK_ON"
              ? "text-[var(--long)] bg-[var(--long)]/10 border-[var(--long)]/25"
              : aggregate.risk_on_off === "RISK_OFF"
              ? "text-[var(--short)] bg-[var(--short)]/10 border-[var(--short)]/25"
              : "text-[var(--text-muted)] bg-[var(--bg-primary)] border-[var(--border)]"
          )}>
            {aggregate.risk_on_off === "RISK_ON" ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : aggregate.risk_on_off === "RISK_OFF" ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Gauge className="w-3.5 h-3.5" />
            )}
            {aggregate.risk_on_off.replace("_", " ")}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BiasCard
            label="Equity Bias"
            score={aggregate.equity_bias}
          />
          <BiasCard
            label="Bonds Bias"
            score={aggregate.bonds_bias}
            note="Negative bonds bias = risk-on context"
          />
          <BiasCard
            label="Commodities Bias"
            score={aggregate.commodities_bias}
          />
        </div>
      </div>

      {/* Per-instrument table */}
      {instruments.length > 0 && <InstrumentTable instruments={instruments} />}

      {/* Alerts */}
      <AlertsFeed alerts={alerts} />

      {/* Metadata */}
      {(asOfDate || dataSource || lastUpdated) && (
        <p className="text-xs text-[var(--text-muted)]">
          As of: {asOfDate}
          {dataSource && <> · Source: {dataSource}</>}
          {lastUpdated && <> · Updated: {lastUpdated}</>}
        </p>
      )}
    </div>
  );
}

// ─── Fallback display using market-direction data ─────────────────────────────

interface CtaFallbackInstrumentRow {
  symbol: string;
  cta: { score: number; label: CtaLabel; next_sell_trigger?: { level: number; distance_pct: number }; next_buy_trigger?: { level: number; distance_pct: number } };
}

function CtaFallbackDisplay() {
  const { data, isPending } = useMarketDirection();

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded bg-[var(--border)] h-20 w-full" />
        ))}
      </div>
    );
  }

  const cta: CTASignal | undefined = data?.cta;
  if (!cta) {
    return <EmptyState message="Backend module not deployed — run /api/market/direction first" />;
  }

  const rows: CtaFallbackInstrumentRow[] = (
    ["es", "nq", "gc"] as const
  )
    .map((key) => {
      const inst = cta[key];
      if (!inst) return null;
      return { symbol: key.toUpperCase(), cta: inst } as CtaFallbackInstrumentRow;
    })
    .filter((r): r is CtaFallbackInstrumentRow => r !== null);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--caution)]/25 bg-[var(--caution)]/5 p-3 text-xs text-[var(--caution)]">
        Showing fallback data from /api/market/direction. Deploy the CTA module for full data.
      </div>

      {/* Equity bias */}
      <BiasCard label="Equity Bias" score={cta.aggregate_equity_bias} />

      {/* Risk badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">Risk signal:</span>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold",
          cta.risk_on_off === "RISK_ON"
            ? "text-[var(--long)] bg-[var(--long)]/10 border-[var(--long)]/25"
            : cta.risk_on_off === "RISK_OFF"
            ? "text-[var(--short)] bg-[var(--short)]/10 border-[var(--short)]/25"
            : "text-[var(--text-muted)] bg-[var(--bg-primary)] border-[var(--border)]"
        )}>
          {cta.risk_on_off === "RISK_ON" ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : cta.risk_on_off === "RISK_OFF" ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Gauge className="w-3.5 h-3.5" />
          )}
          {cta.risk_on_off.replace("_", " ")}
        </div>
      </div>

      {/* Instrument rows */}
      {rows.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <SectionLabel>Positioning Summary</SectionLabel>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Symbol</th>
                  <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal min-w-[160px]">Score</th>
                  <th className="px-4 py-2 text-left text-[var(--text-muted)] font-normal">Label</th>
                  <th className="px-4 py-2 text-right text-[var(--text-muted)] font-normal">Next Sell</th>
                  <th className="px-4 py-2 text-right text-[var(--text-muted)] font-normal">Next Buy</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 font-mono font-semibold text-[var(--text-primary)]">{row.symbol}</td>
                    <td className="px-4 py-2.5 min-w-[160px]">
                      <ScoreBar score={row.cta.score} compact />
                    </td>
                    <td className="px-4 py-2.5">
                      <CtaBadge label={row.cta.label} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {row.cta.next_sell_trigger ? (
                        <span className="flex flex-col items-end">
                          <span className="text-[var(--short)] flex items-center gap-0.5">
                            <ArrowDown className="w-3 h-3" />{fmtLevel(row.cta.next_sell_trigger.level)}
                          </span>
                          <span className="text-[var(--text-muted)] text-xs">{fmtPct(row.cta.next_sell_trigger.distance_pct)}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {row.cta.next_buy_trigger ? (
                        <span className="flex flex-col items-end">
                          <span className="text-[var(--long)] flex items-center gap-0.5">
                            <ArrowUp className="w-3 h-3" />{fmtLevel(row.cta.next_buy_trigger.level)}
                          </span>
                          <span className="text-[var(--text-muted)] text-xs">{fmtPct(row.cta.next_buy_trigger.distance_pct)}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      {cta.alerts && cta.alerts.length > 0 && <AlertsFeed alerts={cta.alerts} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CtaPanel() {
  const { data: ctaData, isPending, isError } = useCTAAll();

  return (
    <div className="space-y-4">
      {isPending ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded bg-[var(--border)] h-24 w-full" />
            ))}
          </div>
          <div className="rounded bg-[var(--border)] h-48 w-full" />
        </div>
      ) : isError || !ctaData ? (
        <CtaFallbackDisplay />
      ) : (
        <CtaFullDisplay
          aggregate={ctaData.aggregate}
          instruments={ctaData.instruments}
          alerts={ctaData.alerts}
          asOfDate={ctaData.as_of_date}
          dataSource={ctaData.data_source}
          lastUpdated={ctaData.last_updated}
        />
      )}

      {/* About CTA section */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <SectionLabel>About CTA Positioning</SectionLabel>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Commodity Trading Advisors (CTAs) are trend-following systematic funds managing hundreds of
          billions across equities, bonds, and commodities. Their positioning is estimated via
          price-based proxies (20/50/100/200 MA slopes) correlated with COT reports. When CTAs reach
          MAX_LONG or MAX_SHORT, they become potential reversal fuel — the triggers show the price
          levels where their momentum models flip, causing coordinated buy or sell waves. RISK_ON
          means CTAs are net-long equities and short bonds; RISK_OFF is the opposite. Monitoring flip
          triggers helps anticipate self-reinforcing trend accelerations or sudden reversals.
        </p>
      </div>
    </div>
  );
}
