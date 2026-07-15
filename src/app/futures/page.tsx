"use client";

/**
 * /futures — rebuilt on the real futures_plan engine (Phase 2,
 * docs/ALPHASTREAM_UX_REDESIGN.md §3.4). The old page rendered CTA labels
 * and gamma-wall levels from the /api/market/direction composite with
 * decorative per-instrument colors; this renders what the engine actually
 * decided: bias, confidence, tier, today's action, the setup, the signal
 * votes that produced it, and event suppression as a blocking banner.
 */

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useFuturesPlan } from "@/hooks/use-futures-plan";
import { GlossaryLink } from "@/components/glossary-link";
import { CollarPanel } from "@/components/futures/collar-panel";
import { cn } from "@/lib/utils";
import type { FuturesInstrumentPlan, FuturesLevel } from "@/lib/types";

const INSTRUMENT_ORDER = ["ES", "NQ", "GC", "SI"] as const;
const INSTRUMENT_NAMES: Record<string, string> = {
  ES: "E-mini S&P 500",
  NQ: "E-mini NASDAQ-100",
  GC: "Gold",
  SI: "Silver",
};

const ACTION_LABEL: Record<string, string> = {
  STAND_ASIDE: "Stand aside",
  ENTER_NOW: "Enter now",
  ENTER_ON_PULLBACK: "Enter on pullback",
};

function fmtPrice(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── The "why" ledger — reason_trail is a pipe-delimited vote string,
   e.g. "CTA +1.00 (+30) | front-week GEX - (-8) | charm pin DOWN (-7)".
   This is the evidence a discretionary trader needs before trusting the
   bias, not a footnote. ── */
function VoteLedger({ reasonTrail }: { reasonTrail: string }) {
  const votes = reasonTrail
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
  if (votes.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-1.5">Why</p>
      <ul className="flex flex-wrap gap-1.5">
        {votes.map((v) => {
          const negative = /\(-/.test(v);
          const positive = /\(\+/.test(v);
          return (
            <li
              key={v}
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded border",
                negative
                  ? "text-red-400 border-red-500/25 bg-red-500/5"
                  : positive
                    ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/5"
                    : "text-[var(--text-muted)] border-[var(--border)]"
              )}
            >
              {v}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SetupBlock({
  setup,
  direction,
}: {
  setup: NonNullable<FuturesInstrumentPlan["long_setup"]>;
  direction: "long" | "short";
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3 space-y-2">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
        {direction === "long" ? "Long setup" : "Short setup"}
      </p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm font-mono tabular-nums">
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Entry</dt>
          <dd className="text-[var(--text-primary)]">
            {fmtPrice(setup.entry_zone[0])}–{fmtPrice(setup.entry_zone[1])}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Stop</dt>
          <dd className="text-red-400">{fmtPrice(setup.stop)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Target</dt>
          <dd className="text-emerald-400">{fmtPrice(setup.target_1)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">
            <GlossaryLink term="R-multiple (avg R)">R:R</GlossaryLink>
          </dt>
          <dd className="text-[var(--text-primary)]">
            {setup.rr_t1 != null ? `${setup.rr_t1.toFixed(1)}x` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Hold</dt>
          <dd className="text-[var(--text-primary)]">
            {setup.expected_holding_days[0]}–{setup.expected_holding_days[1]}d
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Size (1% risk)</dt>
          <dd className="text-[var(--text-primary)]">{setup.micro_contracts_1pct_risk} micro</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Margin</dt>
          <dd className="text-[var(--text-primary)]">
            ${setup.margin_required_micro.toLocaleString("en-US")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Time stop</dt>
          <dd className="text-[var(--text-primary)] text-xs">{setup.time_stop}</dd>
        </div>
      </dl>
      <p className="text-xs text-[var(--text-muted)]">{setup.condition}</p>
    </div>
  );
}

function LevelLadder({ levels, spot }: { levels: FuturesLevel[]; spot: number }) {
  if (levels.length === 0) return null;
  const sorted = [...levels].sort((a, b) => b.price - a.price);

  return (
    <details className="rounded border border-[var(--border)] bg-[var(--bg-primary)]">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
        Level ladder ({levels.length})
      </summary>
      <div className="px-3 pb-3 space-y-1">
        {sorted.map((lvl) => (
          <div
            key={lvl.price}
            className="flex items-center justify-between gap-3 text-xs font-mono py-1 border-b border-[var(--border)]/50 last:border-0"
          >
            <span
              className={cn(
                "w-16 shrink-0",
                lvl.kind === "resistance" ? "text-red-400" : "text-emerald-400"
              )}
            >
              {fmtPrice(lvl.price)}
            </span>
            <span className="flex-1 text-[var(--text-muted)] font-sans truncate">
              {lvl.sources.join(", ")}
            </span>
            <span className="text-[var(--text-muted)] tabular-nums shrink-0">
              {lvl.pct_from_spot >= 0 ? "+" : ""}
              {lvl.pct_from_spot.toFixed(2)}%
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs font-mono pt-1 text-[var(--accent)]">
          <span className="w-16 shrink-0">{fmtPrice(spot)}</span>
          <span className="font-sans">spot</span>
        </div>
      </div>
    </details>
  );
}

function InstrumentCard({ instrument, plan }: { instrument: string; plan: FuturesInstrumentPlan | null }) {
  if (!plan) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{instrument}</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          No plan today — price data hasn&apos;t been downloaded for {INSTRUMENT_NAMES[instrument]}.
        </p>
      </div>
    );
  }

  const activeSetup =
    plan.bias === "LONG" ? plan.long_setup : plan.bias === "SHORT" ? plan.short_setup : null;

  const biasColor =
    plan.bias === "LONG" ? "text-emerald-400" : plan.bias === "SHORT" ? "text-red-400" : "text-[var(--text-muted)]";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-[var(--text-primary)]">{instrument}</span>
            <span className={cn("text-sm font-semibold", biasColor)}>{plan.bias}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">{INSTRUMENT_NAMES[instrument]}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm tabular-nums text-[var(--text-primary)]">
            {fmtPrice(plan.spot)}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            <GlossaryLink term="Confidence / conviction score">{plan.confidence}/100</GlossaryLink>
          </p>
        </div>
      </div>

      {/* Event suppression — blocking banner, not a footnote */}
      {plan.event_rules.suppress_new_entries && (
        <div className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            New entries blocked —{" "}
            <GlossaryLink term="Event suppression" className="underline decoration-dotted">
              event suppression
            </GlossaryLink>{" "}
            active. {plan.event_rules.notes[0]}
          </span>
        </div>
      )}

      {/* Today's action */}
      <div
        className={cn(
          "rounded px-3 py-2 text-sm font-semibold",
          plan.today_action === "STAND_ASIDE"
            ? "bg-[var(--bg-primary)] text-[var(--text-muted)]"
            : plan.today_action === "ENTER_NOW"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
        )}
      >
        {ACTION_LABEL[plan.today_action] ?? plan.today_action}
        <span className="ml-2 font-normal text-xs opacity-80">
          {plan.tier}
          {plan.pattern_signal?.tier && ` · pattern ${plan.pattern_signal.tier.toLowerCase()}`}
        </span>
      </div>

      {activeSetup && <SetupBlock setup={activeSetup} direction={plan.bias === "LONG" ? "long" : "short"} />}

      {plan.invalidation && (
        <p className="text-xs text-[var(--text-muted)]">
          <span className="font-semibold">Invalidation:</span> {plan.invalidation}
        </p>
      )}

      <VoteLedger reasonTrail={plan.reason_trail} />

      <LevelLadder levels={plan.level_ladder} spot={plan.spot} />
    </div>
  );
}

export default function FuturesPage() {
  const { data, isLoading, error } = useFuturesPlan();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-6 w-40 rounded bg-[var(--bg-card)] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {INSTRUMENT_ORDER.map((i) => (
            <div key={i} className="h-64 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h1 className="text-base font-semibold text-[var(--text-primary)] mb-2">
          No futures plan generated yet
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Run <code className="font-mono text-[var(--text-primary)]">python main.py --futures-plan</code>{" "}
          on the backend — this page will pick it up automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Futures</h1>
        <span className="text-sm text-[var(--text-muted)]">{data.date}</span>
      </header>

      {!data.is_today && (
        <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          This is {data.date}&apos;s plan — run <code className="font-mono">--futures-plan</code> on
          the backend to refresh.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {INSTRUMENT_ORDER.map((instrument) => (
          <InstrumentCard key={instrument} instrument={instrument} plan={data.plans[instrument] ?? null} />
        ))}
      </div>

      <Link
        href="/options"
        className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
      >
        See the options market read (GEX) <ChevronRight className="h-3.5 w-3.5" />
      </Link>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <CollarPanel />
      </div>
    </div>
  );
}
