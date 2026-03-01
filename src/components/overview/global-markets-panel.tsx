"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Globe, Sparkles, ArrowRight } from "lucide-react";
import { useGlobalReport } from "@/hooks/use-global-report";
import { useSessions } from "@/hooks/use-sessions";
import { STAGE_COLORS } from "@/lib/constants";
import type { GlobalIndexEntry, GlobalSynthesis } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────

export const COUNTRY_FLAGS: Record<string, string> = {
  Japan: "🇯🇵", "South Korea": "🇰🇷", Taiwan: "🇹🇼",
  India: "🇮🇳", Australia: "🇦🇺", "United Kingdom": "🇬🇧", Europe: "🇪🇺",
};
export function getCountryFlag(country: string) { return COUNTRY_FLAGS[country] ?? "🌐"; }

export function getStageKey(stage: string | null): string | null {
  if (!stage) return null;
  if (STAGE_COLORS[stage]) return stage;
  const m = stage.match(/Stage\s+(\w+)/i);
  return m && STAGE_COLORS[m[1]] ? m[1] : null;
}

export function formatPct(val: number | null): string {
  if (val == null) return "—";
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}

export function formatUpdated(isoStr: string): { label: string; stale: boolean } {
  const date = new Date(isoStr);
  const diffH = (Date.now() - date.getTime()) / 3_600_000;
  const stale = diffH > 24;
  const label =
    diffH < 1 ? `${Math.round(diffH * 60)}m ago` :
    diffH < 24 ? `${Math.floor(diffH)}h ago` :
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label, stale };
}

// ── Style constants (exported for /markets page) ───────────────────────────

export const BIAS_STYLES = {
  BULLISH: "text-green-400 bg-green-500/10 border-green-500/25",
  BEARISH: "text-red-400 bg-red-500/10 border-red-500/25",
  NEUTRAL: "text-amber-400 bg-amber-500/10 border-amber-500/25",
} as const;

export const RISK_SIGNAL_STYLES: Record<string, string> = {
  "Risk-On":  "text-green-400 bg-green-500/10 border-green-500/25",
  "Risk-Off": "text-red-400 bg-red-500/10 border-red-500/25",
  Neutral:    "text-amber-400 bg-amber-500/10 border-amber-500/25",
};

export const BACKDROP_STYLES: Record<string, string> = {
  Supportive: "text-green-400 bg-green-500/10 border-green-500/25",
  Headwind:   "text-red-400 bg-red-500/10 border-red-500/25",
  Neutral:    "text-amber-400 bg-amber-500/10 border-amber-500/25",
};

export const ASSESSMENT_STYLES: Record<string, string> = {
  "Synchronized Rally":  "text-green-400 bg-green-500/10 border-green-500/25",
  "Regional Divergence": "text-amber-400 bg-amber-500/10 border-amber-500/25",
  "Broad Weakness":      "text-red-400 bg-red-500/10 border-red-500/25",
};

// ── GlobalIndexCard (overview — links to /markets?index=ticker) ────────────

function GlobalIndexCard({ entry }: { entry: GlobalIndexEntry }) {
  const { screening, ai_analysis, name, ticker, country } = entry;
  const pct5d    = screening.pct_chg_5d;
  const stageKey = getStageKey(screening.stage);
  const stageInfo = stageKey ? STAGE_COLORS[stageKey] : null;
  const bias      = ai_analysis?.market_signal?.bias;
  const hasAI     = !!(ai_analysis?.trend_analysis || ai_analysis?.market_signal || ai_analysis?.summary);

  return (
    <Link
      href={`/markets?index=${encodeURIComponent(ticker)}`}
      className={cn(
        "relative rounded-lg border bg-[var(--bg-card)] p-3.5",
        "flex flex-col gap-2.5 overflow-hidden",
        "border-[var(--border)] hover:border-[var(--accent)]/40 transition-all duration-150",
      )}
    >
      {stageInfo && (
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: stageInfo.color }} />
      )}
      {hasAI && (
        <Sparkles className="absolute top-2.5 right-2.5 h-3 w-3 text-[var(--text-muted)]/50" />
      )}

      <div className="pr-5">
        <span className="text-xl leading-none">{getCountryFlag(country)}</span>
        <div className="mt-1.5">
          <div className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight truncate">{name}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{ticker}</div>
        </div>
      </div>

      <div>
        <div className={cn(
          "text-[22px] font-bold tabular-nums leading-none",
          pct5d == null ? "text-[var(--text-muted)]"
            : pct5d >= 0 ? "text-green-400" : "text-red-400",
        )}>
          {formatPct(pct5d)}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mt-0.5">5-day</div>
      </div>

      <div className="flex items-center gap-1.5">
        {(["50", "200"] as const).map((p) => {
          const pos = p === "50" ? screening.sma50_position : screening.sma200_position;
          return (
            <div key={p} className="flex items-center gap-1">
              <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">{p}</span>
              <div className={cn("w-1.5 h-1.5 rounded-full",
                pos === "Above" ? "bg-green-400" : pos === "Below" ? "bg-red-400" : "bg-[var(--text-muted)]"
              )} />
            </div>
          );
        })}
        {screening.rsi_14 != null && (
          <span className="text-[9px] text-[var(--text-muted)] ml-auto font-mono">RSI {Math.round(screening.rsi_14)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-auto">
        {stageInfo && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide"
            style={{ color: stageInfo.color, backgroundColor: `${stageInfo.color}15`, borderColor: `${stageInfo.color}30` }}>
            {stageInfo.label}
          </span>
        )}
        {bias && (
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide", BIAS_STYLES[bias])}>
            {bias}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── GlobalSynthesisCard ────────────────────────────────────────────────────

export function GlobalSynthesisCard({ synthesis }: { synthesis: GlobalSynthesis }) {
  const { global_breadth, regional_analysis, us_implications, executive_summary } = synthesis;
  const total = global_breadth ? global_breadth.bullish_markets + global_breadth.bearish_markets : 0;
  const bullishPct = total > 0 ? (global_breadth!.bullish_markets / total) * 100 : 0;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      {/* Breadth */}
      {global_breadth && (
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${bullishPct}%` }} />
          </div>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">
            {global_breadth.bullish_markets}/{total} bullish
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
            ASSESSMENT_STYLES[global_breadth.assessment] ?? ASSESSMENT_STYLES["Regional Divergence"],
          )}>
            {global_breadth.assessment}
          </span>
        </div>
      )}

      {/* Regional */}
      {regional_analysis && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]">Strongest</span>
              <span className="font-medium text-green-400">{regional_analysis.strongest_region}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]">Weakest</span>
              <span className="font-medium text-red-400">{regional_analysis.weakest_region}</span>
            </div>
          </div>
          {regional_analysis.key_divergences && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{regional_analysis.key_divergences}</p>
          )}
        </>
      )}

      {/* US implications */}
      {us_implications && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
            RISK_SIGNAL_STYLES[us_implications.risk_signal] ?? RISK_SIGNAL_STYLES.Neutral,
          )}>
            {us_implications.risk_signal}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
            BACKDROP_STYLES[us_implications.global_backdrop] ?? BACKDROP_STYLES.Neutral,
          )}>
            {us_implications.global_backdrop}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-16 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${us_implications.confidence}%` }} />
            </div>
            <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{us_implications.confidence}%</span>
          </div>
        </div>
      )}

      {executive_summary && (
        <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1 border-t border-[var(--border)]">
          {executive_summary}
        </p>
      )}
    </div>
  );
}

// ── Skeleton / Region label ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3.5 h-36 animate-pulse">
      <div className="h-6 w-6 rounded bg-[var(--bg-primary)] mb-2" />
      <div className="h-3 w-3/4 rounded bg-[var(--bg-primary)] mb-1" />
      <div className="h-2 w-1/2 rounded bg-[var(--bg-primary)] mb-3" />
      <div className="h-5 w-2/3 rounded bg-[var(--bg-primary)] mb-1" />
      <div className="h-2 w-1/4 rounded bg-[var(--bg-primary)]" />
    </div>
  );
}

export function RegionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-[2px] h-3 rounded-full bg-[var(--accent)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

// ── GlobalMarketsPanel ─────────────────────────────────────────────────────

const REGION_ORDER: Array<GlobalIndexEntry["region"]> = ["Asia Pacific", "Europe"];

export function GlobalMarketsPanel() {
  const { data: sessions } = useSessions();
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  // Sessions that have index data, ordered most-recent first (API returns newest first)
  const indexSessions = sessions?.filter((s) => s.has_index_data) ?? [];
  const session = indexSessions.find((s) => !failedIds.has(s.session_id));

  // When session is undefined: calls /api/global-report/latest (natural fallback)
  // When session is defined: calls /api/sessions/{id}/global-report
  const { data, isLoading, isError } = useGlobalReport(session?.session_id);

  useEffect(() => {
    if (isError && session) {
      setFailedIds((prev) => new Set(prev).add(session.session_id));
    }
  }, [isError, session]);

  const updated = useMemo(() => (data?.generated_at ? formatUpdated(data.generated_at) : null), [data]);

  const byRegion = useMemo(() => {
    if (!data?.indexes) return {} as Record<string, GlobalIndexEntry[]>;
    return Object.values(data.indexes).reduce((acc, entry) => {
      if (!acc[entry.region]) acc[entry.region] = [];
      acc[entry.region].push(entry);
      return acc;
    }, {} as Record<string, GlobalIndexEntry[]>);
  }, [data]);

  // All candidate sessions exhausted and no data
  const noData = !isLoading && !data && (isError || (!session && sessions !== undefined));

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Global Markets</h2>
        </div>
        <div className="flex items-center gap-3">
          {updated && (
            <span className={cn("text-xs tabular-nums", updated.stale ? "text-amber-400" : "text-[var(--text-muted)]")}>
              {updated.stale && "⚠ "}updated {updated.label}
            </span>
          )}
          <Link
            href="/markets"
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {isLoading && (
          <div className="space-y-4">
            <div className="h-2.5 w-20 rounded bg-[var(--bg-primary)] animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {noData && (
          <div className="py-5 text-center">
            <p className="text-xs text-[var(--text-muted)]">
              Global market data unavailable —{" "}
              <code className="font-mono text-[10px] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">indexes-ai</code>{" "}
              job required
            </p>
          </div>
        )}

        {data && (
          <>
            {REGION_ORDER.map((region) => {
              const entries = byRegion[region];
              if (!entries?.length) return null;
              return (
                <div key={region}>
                  <RegionLabel label={region} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {entries.map((entry) => (
                      <GlobalIndexCard key={entry.ticker} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}

            {data.global_synthesis && (
              <div>
                <RegionLabel label="Global Synthesis" />
                <GlobalSynthesisCard synthesis={data.global_synthesis} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
