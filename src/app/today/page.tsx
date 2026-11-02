"use client";

/**
 * /today — the landing page (Phase 1 of docs/ALPHASTREAM_UX_REDESIGN.md;
 * unified onto the TriageItem spine in Phase 5, docs/ux-plan-20260719.md §3.1).
 *
 * Fixed triage order: ACT NOW → WATCH → STAND ASIDE → TRACK RECORD.
 * Sourced from the futures/GEX digest plus open-position stop/target
 * proximity, merged through src/lib/triage.ts so this page, the nav badges,
 * and the context-line alert chip all agree on what counts as urgent.
 * Urgency is encoded by position and size, not color saturation. The
 * track-record footer is permanent and non-dismissable — it is the
 * product's honesty budget.
 */

import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, Eye, Minus } from "lucide-react";
import { useScorecard } from "@/hooks/use-digest";
import { useMarkedDone, useTriageGroups, groupDoneKey } from "@/hooks/use-triage";
import { formatPrice } from "@/lib/utils";
import type { TriageGroup, TriageItem } from "@/lib/triage";

/* ── ACT card bodies, one per source ───────────────────────────────────── */

function FuturesActBody({ item }: { item: Extract<TriageItem, { source: "futures" }> }) {
  const entry = item.futures;
  const prose = entry.ai_narrative ?? (entry.whats_happening ?? []).join(" ");

  return (
    <div className="space-y-3">
      {entry.bias && entry.bias !== "NEUTRAL" && (
        <span
          className="text-xs font-semibold"
          style={{ color: entry.bias === "LONG" ? "var(--long)" : "var(--short)" }}
        >
          {entry.bias}
        </span>
      )}
      <p className="text-sm text-[var(--text-primary)]">{item.headline}</p>

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
              {entry.setup.micro_contracts != null ? `${entry.setup.micro_contracts} micro` : "—"}
            </dd>
          </div>
        </dl>
      )}

      {prose && <p className="text-sm text-[var(--text-muted)]">{prose}</p>}

      {(item.risks ?? []).map((r) => (
        <p key={r} className="flex gap-2 text-sm text-[var(--caution)]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{r}</span>
        </p>
      ))}

      <Link
        href={item.href}
        className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
      >
        View full plan <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function PortfolioActBody({ item }: { item: Extract<TriageItem, { source: "portfolio" }> }) {
  const { position, currentPrice, headline, detail } = item;
  const stop = position.trailing_stop || position.stop_loss;
  const target = position.targets?.[0]?.price;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--short)]">{headline}</p>
      {detail && <p className="text-sm text-[var(--text-muted)]">{detail}</p>}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm font-mono tabular-nums">
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Last</dt>
          <dd className="text-[var(--text-primary)]">{formatPrice(currentPrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Entry</dt>
          <dd className="text-[var(--text-primary)]">{formatPrice(position.entry_price)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Stop</dt>
          <dd className="text-[var(--text-primary)]">{formatPrice(stop)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-muted)] font-sans">Target</dt>
          <dd className="text-[var(--text-primary)]">{target != null ? formatPrice(target) : "—"}</dd>
        </div>
      </dl>

      <Link
        href={item.href}
        className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
      >
        View position <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function TriageActCard({
  group,
  isDone,
  onDone,
}: {
  group: TriageGroup;
  isDone: boolean;
  onDone: () => void;
}) {
  if (isDone) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--border)] text-sm text-[var(--text-muted)]">
        <Check className="h-3.5 w-3.5" />
        <span className="font-mono font-semibold">{group.ticker}</span>
        <span>marked done for today</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-base font-bold text-[var(--text-primary)]">{group.ticker}</span>
        <button
          onClick={onDone}
          className="shrink-0 text-xs px-2.5 py-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-colors"
        >
          Mark done
        </button>
      </div>
      {group.items.map((item) =>
        item.source === "futures" ? (
          <FuturesActBody key={item.id} item={item} />
        ) : item.source === "portfolio" ? (
          <PortfolioActBody key={item.id} item={item} />
        ) : null
      )}
    </div>
  );
}

/* ── WATCH / STAND ASIDE — flat lists, ticker + text ───────────────────── */

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
      {label} <span className="text-[var(--text-muted)] font-normal">({count})</span>
    </h2>
  );
}

function WatchList({ items }: { items: TriageItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((w) => (
        <li key={w.id} className="flex items-start gap-2.5 text-sm">
          <Eye className="h-4 w-4 shrink-0 mt-0.5 text-[var(--text-muted)]" />
          <span className="text-[var(--text-primary)]">
            <Link href={w.href} className="font-mono font-semibold hover:text-[var(--accent)]">
              {w.ticker}
            </Link>{" "}
            <span className="text-[var(--text-muted)]">{w.headline}</span>
            {w.detail && <span className="text-[var(--text-muted)]"> — {w.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StandAsideList({ items }: { items: Extract<TriageItem, { source: "futures" }>[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((f) => (
        <li key={f.id} className="flex items-start gap-2.5 text-sm">
          <Minus className="h-4 w-4 shrink-0 mt-0.5 text-[var(--text-muted)]" />
          <span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">{f.ticker}</span>{" "}
            <span className="text-[var(--text-muted)]">{f.headline}</span>
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
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[var(--caution)]" />
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
  const { digest, digestDate, groups, isLoading } = useTriageGroups();
  const { done, markDone } = useMarkedDone(digestDate);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-6 w-56 bg-[var(--bg-card)]" />
        <div className="h-36 bg-[var(--bg-card)]" />
        <div className="h-24 bg-[var(--bg-card)]" />
      </div>
    );
  }

  if (!digest) {
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

  const actGroups = groups.filter((g) => g.severity === "act");
  const watchItems = groups.filter((g) => g.severity === "watch").flatMap((g) => g.items);
  const standAsideItems = groups
    .filter((g) => g.severity === "stand_aside")
    .flatMap((g) => g.items)
    .filter((i): i is Extract<TriageItem, { source: "futures" }> => i.source === "futures");
  const remainingActGroups = actGroups.filter((g) => !done.has(groupDoneKey(g)));

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
          <p className="border border-[var(--caution)]/30 bg-[var(--caution)]/10 px-3 py-2 text-sm text-[var(--caution)]">
            This is {digest.date}&apos;s plan — today&apos;s has not been generated yet.
            Run <code className="font-mono">--daily-digest</code> on the backend to refresh.
          </p>
        )}
      </header>

      {/* ACT NOW */}
      <section className="space-y-3">
        <SectionLabel label="Act now" count={actGroups.length} />
        {actGroups.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing to act on today — the system is standing aside.
          </p>
        ) : remainingActGroups.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nothing left to act on — all handled.
          </p>
        ) : null}
        {actGroups.map((group) => (
          <TriageActCard
            key={group.ticker}
            group={group}
            isDone={done.has(groupDoneKey(group))}
            onDone={() => markDone(groupDoneKey(group))}
          />
        ))}
      </section>

      {/* WATCH */}
      {watchItems.length > 0 && (
        <section className="space-y-3">
          <SectionLabel label="Watch" count={watchItems.length} />
          <WatchList items={watchItems} />
        </section>
      )}

      {/* STAND ASIDE */}
      {standAsideItems.length > 0 && (
        <section className="space-y-3">
          <SectionLabel label="Stand aside" count={standAsideItems.length} />
          <StandAsideList items={standAsideItems} />
        </section>
      )}

      {/* TRACK RECORD — permanent, non-dismissable */}
      <TrackRecordFooter digestRisks={digest.risks ?? []} />
    </div>
  );
}
