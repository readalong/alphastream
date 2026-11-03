"use client";

/**
 * /book — everything open on the ledger (Phase R2, docs/PRODUCT_RESET.md §3
 * in the engine repo). One source: GET /api/book, built from setups.json,
 * the same rows the scorecard and the forward gates score. Replaces the
 * Portfolio page, which read the recommendations engine's own positions file.
 *
 * Filled positions show the stop AS RATCHETED TODAY (breakeven and the
 * chandelier trail included), not the stop that was logged. Pending orders
 * show how many sessions are left before they lapse.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { useBook } from "@/hooks/use-desk";
import { cn, formatPrice } from "@/lib/utils";
import { Chip, Panel, fmtSigned, isNotFound, signClass } from "@/components/desk/primitives";
import type { BookFilledRow, BookPendingRow, BookResponse, BookRowBase } from "@/lib/types";

function Flags({ r }: { r: BookRowBase }) {
  return (
    <span className="flex flex-wrap gap-1">
      {r.kind === "stock" && r.in_capped_book === false && (
        <Chip tone="muted">over cap: logged before the cap, not scored</Chip>
      )}
      {r.kind === "future" && r.current_engine === false && (
        <Chip tone="muted">earlier plan: not counted</Chip>
      )}
    </span>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={cn("py-1.5 pr-3 font-normal", right && "text-right")}>{children}</th>;
}

function FilledTable({ rows }: { rows: BookFilledRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr className="text-left border-b border-[var(--border)]">
            <Th>Ticker</Th><Th>Side</Th><Th>Filled</Th><Th right>Entry</Th><Th right>Stop today</Th>
            <Th right>Last</Th><Th right>R</Th><Th right>Days left</Th><Th>{""}</Th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {rows.map((r) => (
            <tr key={`${r.id}-${r.logged}`} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="py-1.5 pr-3 font-semibold text-[var(--text-primary)]">
                <Link href={`/ticker/${r.symbol}`} className="hover:text-[var(--accent)]">{r.id}</Link>
              </td>
              <td className="py-1.5 pr-3 font-sans text-[var(--text-muted)]">{r.direction}</td>
              <td className="py-1.5 pr-3">{r.fill_date}</td>
              <td className="py-1.5 pr-3 text-right">{r.entry != null ? formatPrice(r.entry) : "—"}</td>
              <td className="py-1.5 pr-3 text-right">
                {formatPrice(r.effective_stop)}
                {r.trailing_active && <span className="ml-1 text-xs text-[var(--text-muted)] font-sans">trail</span>}
              </td>
              <td className="py-1.5 pr-3 text-right">{formatPrice(r.last_close)}</td>
              <td className={cn("py-1.5 pr-3 text-right", signClass(r.unrealized_r))}>{fmtSigned(r.unrealized_r, 2)}</td>
              <td className="py-1.5 pr-3 text-right">{r.bars_remaining}</td>
              <td className="py-1.5"><Flags r={r} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PendingTable({ rows }: { rows: BookPendingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr className="text-left border-b border-[var(--border)]">
            <Th>Ticker</Th><Th>Side</Th><Th>Logged</Th><Th right>Entry band</Th><Th right>Last</Th>
            <Th right>To band</Th><Th right>Sessions left</Th><Th>{""}</Th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {rows.map((r) => (
            <tr key={`${r.id}-${r.logged}`} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="py-1.5 pr-3 font-semibold text-[var(--text-primary)]">
                <Link href={`/ticker/${r.symbol}`} className="hover:text-[var(--accent)]">{r.id}</Link>
              </td>
              <td className="py-1.5 pr-3 font-sans text-[var(--text-muted)]">{r.direction}</td>
              <td className="py-1.5 pr-3">{r.logged}</td>
              <td className="py-1.5 pr-3 text-right">
                {r.entry_zone ? `${r.entry_zone[0]}–${r.entry_zone[1]}` : "—"}
              </td>
              <td className="py-1.5 pr-3 text-right">{r.last_close != null ? formatPrice(r.last_close) : "—"}</td>
              <td className="py-1.5 pr-3 text-right">
                {r.pct_to_entry_band == null ? "—" : r.pct_to_entry_band === 0 ? "in band" : `${fmtSigned(r.pct_to_entry_band, 1)}%`}
              </td>
              <td className={cn("py-1.5 pr-3 text-right", r.sessions_left <= 2 && "text-[var(--caution)]")}>
                {r.sessions_left} / {r.fill_window_days}
              </td>
              <td className="py-1.5"><Flags r={r} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookBody({ b }: { b: BookResponse }) {
  const sb = b.stock_book;
  return (
    <div className="space-y-4">
      {sb && (
        <p className="text-sm text-[var(--text-muted)]">
          Stock book{" "}
          <span className="font-mono text-[var(--text-primary)]">{sb.open}/{sb.cap}</span> open (filled and pending
          both count).{" "}
          {sb.slots_free > 0 ? (
            <span className="text-[var(--long)]">{sb.slots_free} slot{sb.slots_free === 1 ? "" : "s"} free.</span>
          ) : (
            <span className="text-[var(--short)]">Full: no new stock entries until rows close.</span>
          )}
        </p>
      )}

      {b.resolved.length > 0 && (
        <Panel title={`Resolved on the bars (${b.resolved.length})`} subtitle="Stop, target or time stop hit; the next brief writes it">
          <ul className="space-y-1 text-sm">
            {b.resolved.map((r) => (
              <li key={`${r.id}-${r.logged}`} className="font-mono">
                <span className="font-semibold text-[var(--text-primary)]">{r.id}</span>{" "}
                <span className="font-sans text-[var(--text-muted)]">
                  {r.result === "stopped" ? "stopped out" : r.result === "hit_t1" ? "hit target" : "timed out"} on{" "}
                  {r.resolve_date}
                </span>{" "}
                <span className={signClass(r.r_multiple)}>{fmtSigned(r.r_multiple, 2)}R</span>
                <span className="font-sans text-[var(--text-muted)]"> · close it at the broker if still open</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={`Filled (${b.filled.length})`} subtitle="Nearest its stop first; the stop is today's, ratchet and trail included">
        {b.filled.length ? <FilledTable rows={b.filled} /> : <p className="text-sm text-[var(--text-muted)]">Nothing filled.</p>}
      </Panel>

      <Panel title={`Pending orders (${b.pending.length})`} subtitle="Expiring first; cancel at the broker when an order lapses unfilled">
        {b.pending.length ? <PendingTable rows={b.pending} /> : <p className="text-sm text-[var(--text-muted)]">No pending orders.</p>}
      </Panel>

      {b.unknown.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          No price file for: {b.unknown.map((r) => r.id).join(", ")}. Run the data download.
        </p>
      )}
      <p className="text-xs text-[var(--text-muted)]">
        Source: <code className="font-mono">{b.source}</code>, one row per instrument
        {b.superseded_rows ? ` (${b.superseded_rows} older duplicate row${b.superseded_rows === 1 ? "" : "s"} collapsed)` : ""}.
        As of {b.as_of.slice(0, 16).replace("T", " ")} UTC.
      </p>
    </div>
  );
}

export default function BookPage() {
  const { data, isLoading, error } = useBook();
  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-[var(--text-muted)]" />
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Book</h1>
      </header>
      {isLoading ? (
        <div className="h-64 bg-[var(--bg-card)]" />
      ) : data?.unreadable ? (
        <p className="border border-[var(--short)]/40 bg-[var(--short)]/10 px-3 py-2 text-sm text-[var(--short)]">
          The ledger is unreadable, so nothing is shown and no new entries are taken: {data.unreadable}
        </p>
      ) : data ? (
        <BookBody b={data} />
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          {error && !isNotFound(error)
            ? error instanceof Error ? error.message : String(error)
            : "The engine did not return a book. Is the API running?"}
        </p>
      )}
    </div>
  );
}
