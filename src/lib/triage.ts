/**
 * The bubble-up spine (docs/ux-plan-20260719.md §3.1). Pure adapters that map
 * each actionable data source into a shared TriageItem shape so the Today
 * queue, nav badges, and context-line alert chip can all read one model
 * instead of re-deriving urgency per page.
 *
 * Adding a new source (CANSLIM actions, earnings proximity, sector tier
 * changes, flow divergence — see the plan's §3.1 table) means adding one
 * function here that returns TriageItem[]; nothing downstream changes.
 */

import type {
  BookFilledRow,
  BookPendingRow,
  BookResolvedRow,
  BookResponse,
  DailyDigest,
  DigestFuturesEntry,
  DigestGexEntry,
} from "@/lib/types";

export type TriageSeverity = "act" | "watch" | "stand_aside";

interface TriageItemBase {
  id: string;
  ticker: string;
  severity: TriageSeverity;
  headline: string;
  detail?: string;
  href: string;
  risks?: string[];
}

export type TriageItem =
  | (TriageItemBase & { source: "futures"; futures: DigestFuturesEntry })
  | (TriageItemBase & { source: "gex"; gex: DigestGexEntry })
  | (TriageItemBase & {
      source: "book";
      row: BookFilledRow | BookPendingRow | BookResolvedRow;
      kind: "resolved_on_bars" | "near_stop" | "near_target" | "order_expiring";
    });

/* A position is "approaching" its stop or target within this band. */
const NEAR_PCT = 0.015;

const SEVERITY_RANK: Record<TriageSeverity, number> = { act: 0, watch: 1, stand_aside: 2 };

/** Futures + GEX digest -> triage items. Pure; same classification the
 *  former today/page.tsx classify() used, reshaped into TriageItem. */
export function triageFromDigest(digest: DailyDigest): TriageItem[] {
  const items: TriageItem[] = [];

  for (const f of Object.values(digest.futures ?? {})) {
    if (f.available && (f.action_code === "ENTER_NOW" || f.action_code === "ENTER_ON_PULLBACK")) {
      items.push({
        id: `futures:${f.ticker}`,
        ticker: f.ticker,
        severity: "act",
        source: "futures",
        headline: f.bottom_line.replace(new RegExp(`^${f.ticker}: `), ""),
        href: "/futures",
        risks: f.risks,
        futures: f,
      });
    } else if (!f.available || f.action_code === "STAND_ASIDE") {
      items.push({
        id: `futures:${f.ticker}:stand-aside`,
        ticker: f.ticker,
        severity: "stand_aside",
        source: "futures",
        headline: f.available
          ? `no edge${f.tier ? ` (${f.tier.toLowerCase()})` : ""}`
          : "no plan — price data missing",
        href: "/futures",
        futures: f,
      });
    }
  }

  for (const g of Object.values(digest.gex ?? {})) {
    if (!g.available || !g.ticker) continue;
    const ticker = g.ticker;
    (g.proximity_plain ?? []).forEach((text, i) => {
      items.push({
        id: `gex:${ticker}:${i}`,
        ticker,
        severity: "watch",
        source: "gex",
        headline: text,
        href: `/ticker/${ticker}`,
        gex: g,
      });
    });
    if ((g.regime === "SQUEEZE_PRONE" || g.regime === "VOLATILE") && (g.proximity_plain ?? []).length === 0) {
      items.push({
        id: `gex:${ticker}:regime`,
        ticker,
        severity: "watch",
        source: "gex",
        headline: g.bottom_line,
        href: `/ticker/${ticker}`,
        gex: g,
      });
    }
  }

  return items;
}

/** The ledger's open book -> what needs a decision today (Phase R2).
 *  Source of truth is setups.json via GET /api/book, the same rows the
 *  scorecard scores, with the stop as ratcheted today:
 *    - resolved on the bars (stop/target/time hit, not yet written)  -> ACT
 *    - filled and within NEAR_PCT of today's stop or target_1         -> WATCH
 *    - pending order with <= 2 sessions left in its fill window       -> WATCH
 *  Works for longs and shorts. */
export function triageFromBook(book: BookResponse | undefined): TriageItem[] {
  if (!book) return [];
  const items: TriageItem[] = [];
  const item = (
    row: BookFilledRow | BookPendingRow | BookResolvedRow,
    kind: "resolved_on_bars" | "near_stop" | "near_target" | "order_expiring",
    severity: TriageSeverity,
    headline: string,
    detail: string
  ): TriageItem => ({
    id: `book:${row.id}:${row.logged}:${kind}`,
    ticker: row.id,
    severity,
    source: "book",
    headline,
    detail,
    href: "/book",
    row,
    kind,
  });

  for (const r of book.resolved ?? []) {
    const how = r.result === "stopped" ? "stopped out" : r.result === "hit_t1" ? "hit its target" : "timed out";
    items.push(item(r, "resolved_on_bars", "act", `${r.id} ${how}`,
      `Close it at the broker if still open${r.r_multiple != null ? ` · ${r.r_multiple >= 0 ? "+" : ""}${r.r_multiple}R` : ""}`));
  }
  for (const r of book.filled ?? []) {
    const long = r.direction === "long";
    const toStop = long ? (r.last_close - r.effective_stop) / r.last_close : (r.effective_stop - r.last_close) / r.last_close;
    if (toStop <= NEAR_PCT) {
      items.push(item(r, "near_stop", "watch", `${r.id} near its stop`,
        `${(toStop * 100).toFixed(1)}% from today's stop ${r.effective_stop} · ${r.unrealized_r >= 0 ? "+" : ""}${r.unrealized_r}R`));
      continue;
    }
    if (r.target_1 != null) {
      const toT = long ? (r.target_1 - r.last_close) / r.last_close : (r.last_close - r.target_1) / r.last_close;
      if (toT >= 0 && toT <= NEAR_PCT) {
        items.push(item(r, "near_target", "watch", `${r.id} near target`,
          `${(toT * 100).toFixed(1)}% from target ${r.target_1}`));
      }
    }
  }
  for (const r of book.pending ?? []) {
    if (r.sessions_left <= 2) {
      items.push(item(r, "order_expiring", "watch", `${r.id} order expires soon`,
        `${r.sessions_left} session${r.sessions_left === 1 ? "" : "s"} left unfilled; cancel it at the broker when it lapses`));
    }
  }
  return items;
}

/** Groups same-ticker items together (plan §3.1: "if NVDA has a CANSLIM BUY
 *  and an earnings warning, render one card with two signal rows, not two
 *  cards"). A group's severity is its most urgent member's severity, so a
 *  ticker with both an ACT and a WATCH signal surfaces in the ACT section. */
export interface TriageGroup {
  ticker: string;
  severity: TriageSeverity;
  items: TriageItem[];
}

export function groupByTicker(items: TriageItem[]): TriageGroup[] {
  const byTicker = new Map<string, TriageItem[]>();
  for (const item of items) {
    const list = byTicker.get(item.ticker);
    if (list) list.push(item);
    else byTicker.set(item.ticker, [item]);
  }
  return [...byTicker.entries()].map(([ticker, tickerItems]) => ({
    ticker,
    severity: tickerItems.reduce(
      (top, it) => (SEVERITY_RANK[it.severity] < SEVERITY_RANK[top] ? it.severity : top),
      tickerItems[0].severity
    ),
    items: tickerItems,
  }));
}
