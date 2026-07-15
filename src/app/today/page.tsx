"use client";

/**
 * /today — the landing page (Phase 1 of docs/ALPHASTREAM_UX_REDESIGN.md).
 *
 * Fixed triage order: ACT NOW → WATCH → STAND ASIDE → TRACK RECORD.
 * Built 1:1 on GET /api/digest + GET /api/scorecard. Urgency is encoded by
 * position and size, not color saturation. The track-record footer is
 * permanent and non-dismissable — it is the product's honesty budget.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, Eye, Minus } from "lucide-react";
import { useDigest, useScorecard } from "@/hooks/use-digest";
import { cn } from "@/lib/utils";
import type { DailyDigest, DigestFuturesEntry, DigestGexEntry } from "@/lib/types";

/* ── "Mark done" — local, per-day, survives reload ─────────────────────── */

function useMarkedDone(digestDate: string | undefined) {
  const storageKey = digestDate ? `alphastream-today-done-${digestDate}` : null;
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setDone(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setDone(new Set());
    }
  }, [storageKey]);

  const markDone = (ticker: string) => {
    if (!storageKey) return;
    setDone((prev) => {
      const next = new Set(prev);
      next.add(ticker);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* private mode etc. — the day just won't persist */
      }
      return next;
    });
  };

  return { done, markDone };
}

/* ── Triage classification (pure) ──────────────────────────────────────── */

interface WatchItem {
  ticker: string;
  text: string;
}

function classify(digest: DailyDigest) {
  const futures = Object.values(digest.futures ?? {});
  const act = futures.filter(
    (f) => f.available && (f.action_code === "ENTER_NOW" || f.action_code === "ENTER_ON_PULLBACK")
  );
  const standAside = futures.filter(
    (f) => !f.available || f.action_code === "STAND_ASIDE"
  );

  const watch: WatchItem[] = [];
  for (const g of Object.values(digest.gex ?? {})) {
    if (!g.available || !g.ticker) continue;
    for (const p of g.proximity_plain ?? []) {
      watch.push({ ticker: g.ticker, text: p });
    }
    if (
      (g.regime === "SQUEEZE_PRONE" || g.regime === "VOLATILE") &&
      (g.proximity_plain ?? []).length === 0
    ) {
      watch.push({ ticker: g.ticker, text: g.bottom_line });
    }
  }

  return { act, watch, standAside };
}

/* ── Sections ───────────────────────────────────────────────────────────── */

function ActCard({
  entry,
  isDone,
  onDone,
}: {
  entry: DigestFuturesEntry;
  isDone: boolean;
  onDone: () => void;
}) {
  const prose = entry.ai_narrative ?? (entry.whats_happening ?? []).join(" ");

  if (isDone) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--border)] text-sm text-[var(--text-muted)]">
        <Check className="h-3.5 w-3.5" />
        <span className="font-mono font-semibold">{entry.ticker}</span>
        <span>marked done for today</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">
              {entry.ticker}
            </span>
            {entry.bias && entry.bias !== "NEUTRAL" && (
              <span
                className={cn(
                  "text-xs font-semibold",
                  entry.bias === "LONG" ? "text-emerald-400" : "text-red-400"
                )}
              >
                {entry.bias}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {entry.bottom_line.replace(new RegExp(`^${entry.ticker}: `), "")}
          </p>
        </div>
        <button
          onClick={onDone}
          className="shrink-0 text-xs px-2.5 py-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-colors"
        >
          Mark done
        </button>
      </div>

      {entry.setup && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm font-mono tabular-nums">
          <div>
            <dt className="text-xs text-[var(--text-muted)] font-sans">Entry</dt>
            <dd className="text-[var(--text-primary)]">{entry.setup.entry_zone}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)] font-sans">Stop</dt>
            <dd className="text-[var(--text-primary)]">{entry.setup.stop}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)] font-sans">Target</dt>
            <dd className="text-[var(--text-primary)]">{entry.setup.target_1}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)] font-sans">Size</dt>
            <dd className="text-[var(--text-primary)]">
              {entry.setup.micro_contracts != null
                ? `${entry.setup.micro_contracts} micro`
                : "—"}
            </dd>
          </div>
        </dl>
      )}

      {prose && <p className="text-sm text-[var(--text-muted)]">{prose}</p>}

      {(entry.risks ?? []).map((r) => (
        <p key={r} className="flex gap-2 text-sm text-amber-400/90">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{r}</span>
        </p>
      ))}

      <Link
        href="/futures"
        className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
      >
        View full plan <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
      {label} <span className="text-[var(--text-muted)] font-normal">({count})</span>
    </h2>
  );
}

function WatchList({ items }: { items: WatchItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((w, i) => (
        <li key={`${w.ticker}-${i}`} className="flex items-start gap-2.5 text-sm">
          <Eye className="h-4 w-4 shrink-0 mt-0.5 text-[var(--text-muted)]" />
          <span className="text-[var(--text-primary)]">
            <Link
              href={`/ticker/${w.ticker}`}
              className="font-mono font-semibold hover:text-[var(--accent)]"
            >
              {w.ticker}
            </Link>{" "}
            <span className="text-[var(--text-muted)]">{w.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function StandAsideList({ items }: { items: DigestFuturesEntry[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((f) => (
        <li key={f.ticker} className="flex items-start gap-2.5 text-sm">
          <Minus className="h-4 w-4 shrink-0 mt-0.5 text-[var(--text-muted)]" />
          <span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {f.ticker}
            </span>{" "}
            <span className="text-[var(--text-muted)]">
              {f.available
                ? `no edge${f.tier ? ` (${f.tier.toLowerCase()})` : ""}`
                : "no plan — price data missing"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function TrackRecordFooter({ digestRisks }: { digestRisks: string[] }) {
  const { data: scorecard } = useScorecard();

  // The digest's deterministic risk sentences already include the track
  // record, sample-size, and negative-expectancy warnings — surface the
  // load-bearing ones (severity-tagged + track-record lines), not all.
  const keyRisks = digestRisks.filter(
    (r) =>
      r.startsWith("[CRITICAL]") ||
      r.startsWith("[WARN]") ||
      r.includes("track record") ||
      r.includes("LOST money") ||
      r.includes("small sample")
  );

  return (
    <footer className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Track record</h2>
        {scorecard && (
          <span className="text-sm font-mono tabular-nums text-[var(--text-muted)]">
            {scorecard.overall.n} trades
            {scorecard.overall.win_rate != null && ` · ${scorecard.overall.win_rate}% win`}
            {scorecard.overall.avg_r != null &&
              ` · ${scorecard.overall.avg_r > 0 ? "+" : ""}${scorecard.overall.avg_r}R avg`}
            {scorecard.open != null && ` · ${scorecard.open} open`}
          </span>
        )}
      </div>
      {keyRisks.map((r) => (
        <p key={r} className="flex gap-2 text-sm text-[var(--text-muted)]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400/80" />
          <span>{r}</span>
        </p>
      ))}
      <Link
        href="/track-record"
        className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
      >
        Full record <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function TodayPage() {
  const { data: digest, isLoading, error } = useDigest();
  const { done, markDone } = useMarkedDone(digest?.session_date ?? digest?.date);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-6 w-56 rounded bg-[var(--bg-card)] animate-pulse" />
        <div className="h-36 rounded-lg bg-[var(--bg-card)] animate-pulse" />
        <div className="h-24 rounded-lg bg-[var(--bg-card)] animate-pulse" />
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h1 className="text-base font-semibold text-[var(--text-primary)] mb-2">
          No plan generated yet
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Today&apos;s digest hasn&apos;t been built. On the backend, run{" "}
          <code className="font-mono text-[var(--text-primary)]">
            python main.py --daily-digest
          </code>{" "}
          — this page will pick it up automatically.
        </p>
      </div>
    );
  }

  const { act, watch, standAside } = classify(digest);
  const remainingAct = act.filter((a) => !done.has(a.ticker));

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
            Today
          </h1>
          <span className="text-sm text-[var(--text-muted)]">{digest.date}</span>
        </div>
        {!digest.is_today && (
          <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            This is {digest.date}&apos;s plan — today&apos;s has not been generated yet.
            Run <code className="font-mono">--daily-digest</code> on the backend to refresh.
          </p>
        )}
      </header>

      {/* ACT NOW */}
      <section className="space-y-3">
        <SectionLabel label="Act now" count={act.length} />
        {act.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing to act on today — the system is standing aside.
          </p>
        ) : remainingAct.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing left to act on — all handled.
          </p>
        ) : null}
        {act.map((entry) => (
          <ActCard
            key={entry.ticker}
            entry={entry}
            isDone={done.has(entry.ticker)}
            onDone={() => markDone(entry.ticker)}
          />
        ))}
      </section>

      {/* WATCH */}
      {watch.length > 0 && (
        <section className="space-y-3">
          <SectionLabel label="Watch" count={watch.length} />
          <WatchList items={watch} />
        </section>
      )}

      {/* STAND ASIDE */}
      {standAside.length > 0 && (
        <section className="space-y-3">
          <SectionLabel label="Stand aside" count={standAside.length} />
          <StandAsideList items={standAside} />
        </section>
      )}

      {/* TRACK RECORD — permanent, non-dismissable */}
      <TrackRecordFooter digestRisks={digest.risks ?? []} />
    </div>
  );
}
