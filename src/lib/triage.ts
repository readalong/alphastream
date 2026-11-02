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

import type { DailyDigest, DigestFuturesEntry, DigestGexEntry, OpenPosition } from "@/lib/types";

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
      source: "portfolio";
      position: OpenPosition;
      currentPrice: number;
      kind: "stop_breached" | "trailing_stop_breached" | "near_stop" | "near_target";
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

/** Open positions + latest close prices -> stop/target proximity items.
 *  Positions in this app are long-only (stop below entry, targets above),
 *  matching OpenPosition's field shape. */
export function triageFromPortfolio(
  positions: OpenPosition[],
  prices: Record<string, number>
): TriageItem[] {
  const items: TriageItem[] = [];

  for (const p of positions) {
    const price = prices[p.ticker];
    if (price == null) continue;

    const trailStop = p.trailing_stop || p.stop_loss;
    const nearestTarget = p.targets?.[0]?.price;

    if (price <= p.stop_loss) {
      items.push(
        portfolioItem(
          p,
          price,
          "stop_breached",
          "act",
          `${p.ticker} at or below stop`,
          `Stop ${p.stop_loss} · last ${price}`
        )
      );
    } else if (price <= trailStop) {
      items.push(
        portfolioItem(
          p,
          price,
          "trailing_stop_breached",
          "act",
          `${p.ticker} at or below trailing stop`,
          `Trailing stop ${trailStop} · last ${price}`
        )
      );
    } else if ((price - trailStop) / price <= NEAR_PCT) {
      items.push(
        portfolioItem(
          p,
          price,
          "near_stop",
          "watch",
          `${p.ticker} approaching stop`,
          `${(((price - trailStop) / price) * 100).toFixed(1)}% above trailing stop ${trailStop}`
        )
      );
    } else if (nearestTarget != null && (nearestTarget - price) / price <= NEAR_PCT) {
      items.push(
        portfolioItem(
          p,
          price,
          "near_target",
          "watch",
          `${p.ticker} approaching target`,
          `${(((nearestTarget - price) / price) * 100).toFixed(1)}% from target ${nearestTarget}`
        )
      );
    }
  }

  return items;
}

function portfolioItem(
  position: OpenPosition,
  currentPrice: number,
  kind: "stop_breached" | "trailing_stop_breached" | "near_stop" | "near_target",
  severity: TriageSeverity,
  headline: string,
  detail: string
): TriageItem {
  return {
    id: `portfolio:${position.ticker}:${kind}`,
    ticker: position.ticker,
    severity,
    source: "portfolio",
    headline,
    detail,
    href: "/portfolio",
    position,
    currentPrice,
    kind,
  };
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
