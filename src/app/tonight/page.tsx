"use client";

/**
 * /tonight — "what do I do tonight?" (Phase R4, docs/PRODUCT_RESET.md §3 in
 * the engine repo). The landing page. One source: GET /api/tonight, built
 * from the plan and slate the nightly brief logged to the ledger.
 *
 * Only the futures plan and the stock slate issue a card. A card is either
 * an order to place before the next open, or a reason there is none. Every
 * card shows how the live trade differs from the backtest and what the
 * backtest and the live record say, read from the pinned reports; nothing
 * here is typed by hand.
 */

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronRight, Moon } from "lucide-react";
import { useTonight } from "@/hooks/use-desk";
import { cn } from "@/lib/utils";
import { Chip, Panel, Stat, isNotFound } from "@/components/desk/primitives";
import type { DecisionCard, TonightResponse } from "@/lib/types";

function verbTone(c: DecisionCard): "long" | "short" | "caution" | "muted" {
  if (c.stale || c.unscored) return "caution";
  if (!c.order) return "muted";
  return c.direction === "short" ? "short" : "long";
}

function LedgerChip({ c }: { c: DecisionCard }) {
  if (!c.order || !c.ledger) return null;
  if (c.ledger.status === "logged") return <Chip tone="muted">on the ledger</Chip>;
  if (c.ledger.status === "different") return <Chip tone="caution">ledger has a different band</Chip>;
  return <Chip tone="caution">not on the ledger: not scored</Chip>;
}

function Card({ c }: { c: DecisionCard }) {
  const [open, setOpen] = useState(false);
  const usd = (v: number | null | undefined) =>
    v == null ? "—" : `$${Math.round(v).toLocaleString()}`;
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <header className="flex flex-wrap items-baseline gap-2">
        <span className="text-base font-semibold text-[var(--text-primary)] font-mono">
          {c.kind === "stock" ? (
            <Link href={`/ticker/${c.symbol}`} className="hover:text-[var(--accent)]">{c.instrument}</Link>
          ) : c.instrument}
        </span>
        <Chip tone={verbTone(c)}>{c.verb}</Chip>
        <LedgerChip c={c} />
      </header>

      <p className="text-sm text-[var(--text-primary)]">{c.why}</p>

      {c.order && (
        <div className="space-y-2">
          <p className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] break-words">
            {c.order.text}
          </p>
          {c.size && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Size" value={`${c.size.qty} ${c.size.unit}`} />
              <Stat label="Risk if stopped" value={usd(c.size.risk_usd)} />
              <Stat label="Risk %" value={`${(c.size.risk_pct * 100).toFixed(1)}% of ${usd(c.size.account)}`} />
              <Stat label="Cancel after" value={`${c.order.cancel_after_sessions} sessions`} />
            </dl>
          )}
          {c.size?.note && <p className="text-xs text-[var(--caution)]">{c.size.note}</p>}
          {c.size?.why_not_1pct && <p className="text-xs text-[var(--text-muted)]">{c.size.why_not_1pct}</p>}
          {c.invalidation.length > 0 && (
            <ul className="text-xs text-[var(--text-primary)] space-y-0.5">
              {c.invalidation.map((x) => (
                <li key={x} className={cn(x.includes("could not check") && "text-[var(--caution)]")}>
                  Cancel / skip: {x}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {c.evidence.lines.length > 0 && (
        <ul className="text-xs text-[var(--text-muted)] space-y-0.5 font-mono">
          {c.evidence.lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
      )}

      {(c.deviations.length > 0 || c.context.length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-expanded={open}
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {c.deviations.length} way{c.deviations.length === 1 ? "" : "s"} this differs from the backtest
            {c.context.length ? `, ${c.context.length} context line${c.context.length === 1 ? "" : "s"}` : ""}
          </button>
          {open && (
            <div className="mt-2 space-y-2 text-xs">
              {c.deviations.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
                  {c.deviations.map((d) => <li key={d}>{d}</li>)}
                </ul>
              )}
              {c.context.length > 0 && (
                <ul className="space-y-1 text-[var(--text-muted)]">
                  {c.context.map((x) => (
                    <li key={x.label + x.text}>
                      <span className="uppercase tracking-wide">{x.label}:</span> {x.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Section({ title, sub, cards, note }: { title: string; sub: string; cards: DecisionCard[]; note?: string }) {
  return (
    <Panel title={title} subtitle={sub}>
      <div className="space-y-3">
        {note && <p className="text-sm text-[var(--text-muted)]">{note}</p>}
        {cards.length ? (
          <div className="grid gap-3 lg:grid-cols-2">{cards.map((c) => <Card key={c.instrument} c={c} />)}</div>
        ) : !note ? (
          <p className="text-sm text-[var(--text-muted)]">No cards.</p>
        ) : null}
      </div>
    </Panel>
  );
}

function statusText(s: { status?: string; date?: string | null }) {
  if (s.status === "missing") return "not built yet";
  return `built ${s.date ?? "?"}, ${s.status === "stale" ? "stale" : "current"}`;
}

function TonightBody({ t }: { t: TonightResponse }) {
  const stale = t.futures.status !== "current" || t.stocks.status !== "current" || t.warnings.length > 0;
  const r = t.risk;
  return (
    <div className="space-y-4">
      <p className={cn("text-base text-[var(--text-primary)]", stale && "text-[var(--caution)]")}>{t.headline}</p>

      {t.warnings.map((w) => (
        <p key={w} className="flex items-start gap-2 border border-[var(--caution)]/30 bg-[var(--caution)]/10 px-3 py-2 text-sm text-[var(--caution)]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{w}</span>
        </p>
      ))}

      <Section
        title="Futures"
        sub={`Plan ${statusText(t.futures)}. Micros, sized at the plan's risk.`}
        cards={t.futures.cards}
      />
      <Section
        title="Stocks"
        sub={`Slate ${statusText(t.stocks)}. New entries only into free book slots: a stop-limit at the pivot, or a limit back into the band once price is past it.`}
        cards={t.stocks.cards}
        note={t.stocks.note ?? t.stocks.book}
      />

      {t.events.length > 0 && (
        <Panel title="Events" subtitle="Warnings only: the validated record trades through events">
          <ul className="text-sm text-[var(--text-muted)] list-disc pl-5 space-y-0.5">
            {t.events.map((e) => <li key={e.text}>{e.text}</li>)}
          </ul>
        </Panel>
      )}

      <Panel title="Risk if every order fills">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Orders" value={r.orders} />
          <Stat label="Total" value={`$${r.total_usd.toLocaleString()} (${(r.total_pct ?? 0).toFixed(2)}%)`} />
          <Stat label="Futures" value={`${r.futures_pct.toFixed(2)}% of a ${r.futures_heat_cap_pct}% cap`}
                className={r.warning ? "text-[var(--short)]" : undefined} />
          <Stat label="Stocks" value={`$${r.stocks_usd.toLocaleString()}`} />
        </dl>
        {r.warning && <p className="mt-2 text-xs text-[var(--short)]">{r.warning}</p>}
      </Panel>

      {t.stocks.book_summary && (
        <p className="text-sm text-[var(--text-muted)]">
          Already on: {t.stocks.book_summary.filled} filled, {t.stocks.book_summary.pending} pending orders
          {t.stocks.book_summary.resolved ? `, ${t.stocks.book_summary.resolved} resolved but not yet written` : ""}
          {t.stocks.book_summary.unknown ? `, ${t.stocks.book_summary.unknown} with no price file` : ""}.{" "}
          <Link href="/book" className="text-[var(--accent)] hover:underline">Manage them on the Book</Link>.
        </p>
      )}
      <p className="text-xs text-[var(--text-muted)]">
        Cards are built after the close; place orders before the next session opens. As of{" "}
        {t.as_of.slice(0, 16).replace("T", " ")} UTC.
      </p>
    </div>
  );
}

export default function TonightPage() {
  const { data, isLoading, error } = useTonight();
  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-[var(--text-muted)]" />
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Tonight</h1>
      </header>
      {isLoading ? (
        <div className="h-64 bg-[var(--bg-card)]" />
      ) : data ? (
        <TonightBody t={data} />
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          {error && !isNotFound(error)
            ? error instanceof Error ? error.message : String(error)
            : "The engine did not return tonight's page. Is the API running?"}
        </p>
      )}
    </div>
  );
}
