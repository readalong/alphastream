"use client";

/**
 * /theses — the thesis book (trading-discovery-engine app/thesis_book.py).
 *
 * Each thesis is a pre-registered rule set on the desk state. Tonight's
 * status and conviction are mechanical: conviction = 25 + 50 × support share
 * + 25 × confirm share, and any invalidation rule zeroes it (backend
 * evaluate_thesis). The scorecard
 * counts independent episodes against the instrument's base rate; nothing
 * is called an edge before 30 episodes and a bootstrap CI that clears zero.
 */

import { useState } from "react";
import { Check, CircleDashed, X } from "lucide-react";
import { useTheses, useThesisHistory } from "@/hooks/use-desk";
import { cn } from "@/lib/utils";
import { Chip, EmptyState, LoadError, Panel, StaleBanner, fmtNum, fmtSigned, isNotFound } from "@/components/desk/primitives";
import type { ThesisHistoryReport, ThesisRow, ThesisRuleResult, ThesisScore, ThesisStatus } from "@/lib/types";

const STATUS_TONE: Record<ThesisStatus, "long" | "short" | "caution" | "muted"> = {
  CONFIRMED: "long",
  BUILDING: "caution",
  DORMANT: "muted",
  INVALIDATED: "short",
};

const VERDICT_TONE: Record<string, "long" | "short" | "caution" | "muted"> = {
  EDGE: "long",
  NO_EDGE: "short",
  INSUFFICIENT_DATA: "muted",
  NOT_RECONSTRUCTABLE: "muted",
};

function observed(v: unknown): string {
  if (v == null) return "no data";
  if (typeof v === "number") return fmtNum(v, Math.abs(v) >= 100 ? 0 : 2);
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function RuleLine({ r, group }: { r: ThesisRuleResult; group: "support" | "confirm" | "invalidate" }) {
  // For an invalidation rule, "met" is bad news.
  const good = group === "invalidate" ? r.met === false : r.met === true;
  const bad = group === "invalidate" ? r.met === true : r.met === false;
  const Icon = r.met == null ? CircleDashed : good ? Check : X;
  return (
    <li className="flex items-start gap-2 text-xs">
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 mt-0.5",
          r.met == null && "text-[var(--text-faint)]",
          good && "text-[var(--long)]",
          bad && "text-[var(--short)]"
        )}
        aria-label={r.met == null ? "no data" : r.met ? "met" : "not met"}
      />
      <span className={cn("flex-1", r.met == null && "text-[var(--text-muted)]")}>{r.text}</span>
      <span className="font-mono tabular-nums text-[var(--text-muted)] shrink-0 max-w-[40%] truncate" title={observed(r.observed)}>
        {observed(r.observed)}
      </span>
    </li>
  );
}

function ThesisCard({ t, score }: { t: ThesisRow; score?: ThesisScore }) {
  const groups: { key: "support" | "confirm" | "invalidate"; label: string }[] = [
    { key: "support", label: `Support ${t.support_met}/${t.support_n}` },
    { key: "confirm", label: `Confirm ${t.confirm_met}/${t.confirm_n}` },
    { key: "invalidate", label: "Invalidate" },
  ];
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-[var(--text-muted)]">
            {t.key} · {t.direction.toLowerCase()} · {t.horizon} sessions · {t.instrument ?? "no instrument tonight"}
          </p>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{t.title}</h2>
        </div>
        <div className="text-right shrink-0">
          <Chip tone={STATUS_TONE[t.status]}>{t.status.toLowerCase()}</Chip>
          <p className="mt-1 font-mono text-lg tabular-nums text-[var(--text-primary)]" title="25 + 50 × support share + 25 × confirm share; 0 when invalidated">
            {t.conviction}
          </p>
        </div>
      </header>
      <p className="text-sm text-[var(--text-muted)]">{t.why}</p>
      <div className="space-y-2">
        {groups.map((g) =>
          t.rules[g.key].length === 0 ? null : (
            <div key={g.key}>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{g.label}</p>
              <ul className="space-y-1">
                {t.rules[g.key].map((r, i) => (
                  <RuleLine key={i} r={r} group={g.key} />
                ))}
              </ul>
            </div>
          )
        )}
      </div>
      <footer className="border-t border-[var(--border)] pt-2 text-xs text-[var(--text-muted)] flex flex-wrap gap-x-4 gap-y-1">
        {t.open_episode ? (
          <span>
            Open episode since <span className="font-mono">{t.open_episode.trigger_date}</span> on{" "}
            <span className="font-mono">{t.open_episode.instrument ?? "—"}</span>
          </span>
        ) : (
          <span>No open episode</span>
        )}
        {score && (
          <span>
            Record: {score.episodes} episode{score.episodes === 1 ? "" : "s"}, {score.scored} scored
            {score.hit_rate != null && ` · hit ${fmtNum(score.hit_rate * 100, 0)}% vs base ${fmtNum((score.base_rate ?? 0) * 100, 0)}%`}
          </span>
        )}
        <span>registered {t.registered}</span>
      </footer>
    </article>
  );
}

function Scorecard({ rows, minEpisodes }: { rows: ThesisScore[]; minEpisodes: number }) {
  return (
    <Panel title="Live scorecard" subtitle={`Independent episodes vs the instrument's base rate. An edge needs ${minEpisodes}+ episodes and a CI above zero.`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead className="text-[var(--text-muted)] font-sans">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">Thesis</th>
              <th className="py-1 pr-3 font-normal">Episodes</th>
              <th className="py-1 pr-3 font-normal">Scored</th>
              <th className="py-1 pr-3 font-normal">Hit</th>
              <th className="py-1 pr-3 font-normal">Base</th>
              <th className="py-1 pr-3 font-normal">Excess CI</th>
              <th className="py-1 font-normal">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.key} className="border-t border-[var(--border)]/50">
                <td className="py-1 pr-3">{s.key}</td>
                <td className="py-1 pr-3">{s.episodes}</td>
                <td className="py-1 pr-3">{s.scored}</td>
                <td className="py-1 pr-3">{s.hit_rate == null ? "—" : `${fmtNum(s.hit_rate * 100, 0)}%`}</td>
                <td className="py-1 pr-3">{s.base_rate == null ? "—" : `${fmtNum(s.base_rate * 100, 0)}%`}</td>
                <td className="py-1 pr-3">
                  {s.excess_ci ? `[${fmtSigned(s.excess_ci.ci_low * 100, 1)}, ${fmtSigned(s.excess_ci.ci_high * 100, 1)}] pts` : "—"}
                </td>
                <td className="py-1">
                  <Chip tone={VERDICT_TONE[s.verdict] ?? "muted"}>{s.verdict.replaceAll("_", " ").toLowerCase()}</Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function HistoryCheck({ h, error }: { h: ThesisHistoryReport | undefined; error: unknown }) {
  if (error && !isNotFound(error)) {
    return (
      <Panel title="History check">
        <p className="text-sm text-[var(--short)] font-mono">{error instanceof Error ? error.message : String(error)}</p>
      </Panel>
    );
  }
  if (!h) {
    return (
      <Panel title="History check">
        <p className="text-sm text-[var(--text-muted)]">
          Not run yet. <code className="font-mono">python main.py --thesis-history</code> (quarterly).
        </p>
      </Panel>
    );
  }
  return (
    <Panel
      title="History check"
      subtitle={`Rules rebuildable from prices only, replayed over ${h.sessions.toLocaleString()} sessions and ${h.universe_size} names. ${h.generated_at.slice(0, 10)}.`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead className="text-[var(--text-muted)] font-sans">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">Thesis</th>
              <th className="py-1 pr-3 font-normal">Rules used / dropped</th>
              <th className="py-1 pr-3 font-normal">Episodes</th>
              <th className="py-1 pr-3 font-normal">Hit</th>
              <th className="py-1 pr-3 font-normal">Base</th>
              <th className="py-1 pr-3 font-normal">Excess CI</th>
              <th className="py-1 font-normal">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {h.results.map((r) => (
              <tr key={r.key} className="border-t border-[var(--border)]/50" title={r.rules_dropped?.length ? `dropped: ${r.rules_dropped.join("; ")}` : undefined}>
                <td className="py-1 pr-3 font-sans">
                  <span className="font-mono text-[var(--text-muted)] mr-1">{r.key}</span>
                  {r.title}
                </td>
                <td className="py-1 pr-3">
                  {r.rules_used?.length ?? 0} / {r.rules_dropped?.length ?? 0}
                </td>
                <td className="py-1 pr-3">{r.episodes ?? "—"}</td>
                <td className="py-1 pr-3">{r.hit_rate == null ? "—" : `${fmtNum(r.hit_rate * 100, 0)}%`}</td>
                <td className="py-1 pr-3">{r.base_rate == null ? "—" : `${fmtNum(r.base_rate * 100, 0)}%`}</td>
                <td className="py-1 pr-3">
                  {r.excess_ci ? `[${fmtSigned(r.excess_ci.ci_low * 100, 1)}, ${fmtSigned(r.excess_ci.ci_high * 100, 1)}] pts` : "—"}
                </td>
                <td className="py-1">
                  <Chip tone={VERDICT_TONE[r.verdict] ?? "muted"}>{r.verdict.replaceAll("_", " ").toLowerCase()}</Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-2 text-xs text-[var(--text-muted)] list-disc pl-4 space-y-0.5">
        {h.caveats.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </Panel>
  );
}

export default function ThesesPage() {
  const { data, isLoading, error } = useTheses();
  const history = useThesisHistory();
  const [filter, setFilter] = useState<ThesisStatus | "ALL">("ALL");

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-6 w-40 bg-[var(--bg-card)]" />
        <div className="h-64 bg-[var(--bg-card)]" />
      </div>
    );
  }
  if (error && !isNotFound(error)) return <LoadError error={error} />;
  if (!data) return <EmptyState title="No thesis book yet" command="--desk-state" />;

  const scores = new Map(data.scorecard.map((s) => [s.key, s]));
  const shown = filter === "ALL" ? data.theses : data.theses.filter((t) => t.status === filter);
  const counts = data.theses.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Thesis Book</h1>
        <span className="text-sm text-[var(--text-muted)]">{data.date}</span>
      </header>
      {data.is_today === false && data.file_date && <StaleBanner date={data.file_date} command="--desk-state" />}
      <p className="text-sm text-[var(--text-muted)] max-w-3xl">{data.note}</p>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        {(["ALL", "CONFIRMED", "BUILDING", "DORMANT", "INVALIDATED"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={filter === s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-2.5 py-1 text-xs border transition-colors",
              filter === s
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}{" "}
            <span className="font-mono">{s === "ALL" ? data.theses.length : counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {shown.map((t) => (
          <ThesisCard key={t.key} t={t} score={scores.get(t.key)} />
        ))}
        {shown.length === 0 && <p className="text-sm text-[var(--text-muted)]">No thesis in that state tonight.</p>}
      </div>

      <Scorecard rows={data.scorecard} minEpisodes={30} />
      <HistoryCheck h={history.data} error={history.error} />
    </div>
  );
}
