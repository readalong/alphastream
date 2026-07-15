"use client";

/**
 * /track-record — the credibility page (Phase 2,
 * docs/ALPHASTREAM_UX_REDESIGN.md §3.5). The live forward scorecard plus
 * the latest backtest review findings, with their real severities. A
 * system that shows its own losing record next to its signals is
 * credible in a way no amount of polish can buy — this page is the
 * detail view behind /today's permanent track-record footer.
 */

import { useState } from "react";
import { useScorecard } from "@/hooks/use-digest";
import { useBacktestReviews } from "@/hooks/use-backtest-reviews";
import { GlossaryLink } from "@/components/glossary-link";
import { cn } from "@/lib/utils";
import type { BacktestFinding, BacktestReview, ScorecardBucket } from "@/lib/types";

function fmtR(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}R`;
}

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/25",
  WARN: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  INFO: "text-[var(--text-muted)] bg-[var(--bg-primary)] border-[var(--border)]",
};

/* ── Scorecard ── */

function BucketRow({ label, bucket }: { label: string; bucket: ScorecardBucket }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="px-3 py-2 font-mono font-semibold text-[var(--text-primary)]">{label}</td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--text-primary)]">
        {bucket.n}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--text-primary)]">
        {bucket.win_rate != null ? `${bucket.win_rate}%` : "—"}
      </td>
      <td
        className={cn(
          "px-3 py-2 text-right font-mono tabular-nums font-semibold",
          bucket.avg_r == null
            ? "text-[var(--text-muted)]"
            : bucket.avg_r > 0
              ? "text-emerald-400"
              : "text-red-400"
        )}
      >
        {fmtR(bucket.avg_r)}
      </td>
    </tr>
  );
}

function ScorecardSection() {
  const { data, isLoading } = useScorecard();

  if (isLoading) {
    return <div className="h-48 rounded-lg bg-[var(--bg-card)] animate-pulse" />;
  }
  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-sm font-mono text-[var(--text-primary)]">{data.headline}</p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
              <th className="text-left font-normal px-3 py-2">Bucket</th>
              <th className="text-right font-normal px-3 py-2">Trades</th>
              <th className="text-right font-normal px-3 py-2">
                <GlossaryLink term="Win rate" className="hover:text-[var(--accent)]">
                  Win rate
                </GlossaryLink>
              </th>
              <th className="text-right font-normal px-3 py-2">
                <GlossaryLink term="R-multiple (avg R)" className="hover:text-[var(--accent)]">
                  Avg R
                </GlossaryLink>
              </th>
            </tr>
          </thead>
          <tbody>
            <BucketRow label="Overall" bucket={data.overall} />
            {Object.entries(data.by_instrument).map(([k, b]) => (
              <BucketRow key={k} label={k} bucket={b} />
            ))}
            {Object.entries(data.by_direction).map(([k, b]) => (
              <BucketRow key={k} label={k} bucket={b} />
            ))}
          </tbody>
        </table>
      </div>

      {data.open_positions.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <p className="px-3 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
            Open positions ({data.open_positions.length})
          </p>
          <table className="w-full text-sm">
            <tbody>
              {data.open_positions.map((p, i) => (
                <tr key={`${p.id}-${i}`} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 font-mono font-semibold text-[var(--text-primary)]">
                    {p.id}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{p.direction}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--text-primary)]">
                    {p.entry_zone ? `${p.entry_zone[0]}–${p.entry_zone[1]}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--text-muted)]">
                    {p.tier ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ── Backtest reviews ── */

function FindingRow({ finding }: { finding: BacktestFinding }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "text-xs font-mono font-bold px-1.5 py-0.5 rounded border shrink-0",
            SEVERITY_STYLE[finding.severity]
          )}
        >
          {finding.severity}
        </span>
        <p className="text-sm text-[var(--text-primary)]">{finding.summary}</p>
      </div>
      <p className="text-xs text-[var(--text-muted)] pl-1">{finding.recommendation}</p>
    </div>
  );
}

function ReviewPanel({ review }: { review: BacktestReview }) {
  const s = review.report_summary;
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded px-3 py-2 text-sm font-semibold",
          review.finding_counts.CRITICAL > 0
            ? "bg-red-500/10 text-red-400 border border-red-500/25"
            : review.finding_counts.WARN > 0
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
        )}
      >
        {review.verdict}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="rounded border border-[var(--border)] p-2.5">
          <dt className="text-xs text-[var(--text-muted)]">Trades</dt>
          <dd className="font-mono tabular-nums text-[var(--text-primary)]">{s.resolved}</dd>
        </div>
        <div className="rounded border border-[var(--border)] p-2.5">
          <dt className="text-xs text-[var(--text-muted)]">
            <GlossaryLink term="Win rate">Win rate</GlossaryLink>
          </dt>
          <dd className="font-mono tabular-nums text-[var(--text-primary)]">
            {s.win_rate != null ? `${s.win_rate}%` : "—"}
          </dd>
        </div>
        <div className="rounded border border-[var(--border)] p-2.5">
          <dt className="text-xs text-[var(--text-muted)]">Avg R</dt>
          <dd
            className={cn(
              "font-mono tabular-nums",
              (s.avg_r ?? 0) > 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {fmtR(s.avg_r)}
          </dd>
        </div>
        <div className="rounded border border-[var(--border)] p-2.5">
          <dt className="text-xs text-[var(--text-muted)]">
            <GlossaryLink term="Drawdown (max, in R)">Max drawdown</GlossaryLink>
          </dt>
          <dd className="font-mono tabular-nums text-[var(--text-primary)]">
            {s.max_drawdown_r != null ? `${s.max_drawdown_r.toFixed(1)}R` : "—"}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-[var(--text-muted)]">
        {s.instruments.join(", ")} · {s.years_covered[0]}–{s.years_covered[s.years_covered.length - 1]}
        {s.best_year && ` · best year ${s.best_year.year} (${fmtR(s.best_year.avg_r)})`}
        {s.worst_year && ` · worst year ${s.worst_year.year} (${fmtR(s.worst_year.avg_r)})`}
      </p>

      <div className="space-y-2">
        {review.findings.map((f) => (
          <FindingRow key={f.id} finding={f} />
        ))}
        {review.findings.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">No findings — clean review.</p>
        )}
      </div>
    </div>
  );
}

function BacktestSection() {
  const { data, isLoading } = useBacktestReviews();
  const [engine, setEngine] = useState<"futures" | "breakout">("futures");

  if (isLoading) {
    return <div className="h-48 rounded-lg bg-[var(--bg-card)] animate-pulse" />;
  }
  if (!data) return null;

  const review = data.reviews[engine];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {(["futures", "breakout"] as const).map((e) => (
          <button
            key={e}
            onClick={() => setEngine(e)}
            className={cn(
              "text-sm px-3 py-1.5 rounded border capitalize",
              engine === e
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {e}
          </button>
        ))}
      </div>
      {review ? (
        <ReviewPanel review={review} />
      ) : (
        <p className="text-sm text-[var(--text-muted)] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          No {engine} backtest review yet. Run{" "}
          <code className="font-mono">
            python main.py --backtest-{engine === "futures" ? "futures" : "breakout"}
          </code>{" "}
          then <code className="font-mono">--backtest-review</code> on the backend.
        </p>
      )}
    </section>
  );
}

export default function TrackRecordPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
          Track record
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          The actual forward record, and what history says about the engines that produce it —
          shown in full, not summarized away.
        </p>
      </header>

      <ScorecardSection />

      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          <GlossaryLink term="Walk-forward backtest">Backtest reviews</GlossaryLink>
        </h2>
        <BacktestSection />
      </div>
    </div>
  );
}
