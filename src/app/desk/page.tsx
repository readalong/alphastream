"use client";

/**
 * /desk — the nightly desk state (trading-discovery-engine --desk-state):
 * dealer levels and their changes, the index layer (breadth, McClellan,
 * Hindenburg, equal- vs cap-weight), macro regime, US net liquidity, the
 * washout feed, the gold gate, and the theme-basket atlas with leans.
 *
 * Everything is shown with its provenance: partial or repaired dealer
 * nights are flagged, missing engines read "not run tonight", and leans
 * below their validation bar are greyed and labelled observation-only.
 */

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useDeskState } from "@/hooks/use-desk";
import { cn } from "@/lib/utils";
import {
  Chip,
  EmptyState,
  LoadError,
  isNotFound,
  NotRun,
  Panel,
  PctBar,
  Stat,
  StaleBanner,
  fmtBn,
  fmtNum,
  fmtSigned,
  signClass,
} from "@/components/desk/primitives";
import type { DeskBasket, DeskDealer, DeskLeans, DeskState, LeanKey } from "@/lib/types";

/** A thrust older than this is history, not a live signal. */
const ZWEIG_RECENT_SESSIONS = 20;

/** inputs keys that are flags about the inputs, not engines that ran. */
const NOT_ENGINES = new Set(["morning_brief_is_tonight"]);

const LEAN_KEYS: { key: LeanKey; label: string }[] = [
  { key: "d3", label: "3D" },
  { key: "d10", label: "10D" },
  { key: "d20", label: "20D" },
  { key: "crash20", label: "Crash" },
];

function DealerCard({ ticker, d }: { ticker: string; d: DeskDealer | null }) {
  if (!d) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3">
        <p className="font-mono font-bold">{ticker}</p>
        <NotRun what="Dealer flow" />
      </div>
    );
  }
  const nodes = [...(d.node_ladder ?? [])].sort((a, b) => b.price - a.price);
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-[var(--text-primary)]">{ticker}</span>
          <span className="font-mono text-sm tabular-nums text-[var(--text-muted)]">{fmtNum(d.spot, 2)}</span>
        </div>
        <div className="flex gap-1">
          {d.quality === "partial" && <Chip tone="caution">partial chain</Chip>}
          {d.repaired && <Chip tone="muted">repaired</Chip>}
        </div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        <Stat label="Net gamma" value={fmtBn(d.net_gex)} className={signClass(d.net_gex)} />
        <Stat
          label={`vs ${d.net_gex_vs_1 ?? "prior"}`}
          value={d.quality === "partial" ? "—" : fmtBn(d.net_gex_chg_1)}
          className={signClass(d.net_gex_chg_1)}
        />
        <Stat
          label={`vs ${d.net_gex_vs_5 ?? "5 back"}`}
          value={d.quality === "partial" ? "—" : fmtBn(d.net_gex_chg_5)}
          className={signClass(d.net_gex_chg_5)}
        />
        <Stat label="Gamma flip" value={fmtNum(d.gamma_flip, 2)} />
        <Stat label="Charm anchor" value={`${fmtNum(d.charm_anchor, 0)} ${d.pin_pressure ? `(${d.pin_pressure.toLowerCase()})` : ""}`} />
        <Stat label="Vanna" value={d.vanna_regime?.replaceAll("_", " ").toLowerCase() ?? "—"} />
      </dl>
      {nodes.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-xs text-[var(--text-muted)]">Node ladder (share of near-spot |GEX|+|CEX|)</p>
          {nodes.map((n) => (
            <div key={n.price} className="flex items-center gap-3 text-xs font-mono">
              <span className="w-14" style={{ color: n.kind === "resistance" ? "var(--short)" : "var(--long)" }}>
                {fmtNum(n.price, 0)}
              </span>
              <span className="w-24 text-[var(--text-muted)] font-sans">{n.character === "accelerant" ? "accelerant" : "magnet / wall"}</span>
              <span className="w-14 tabular-nums">{fmtNum(n.share * 100, 0)}%</span>
              <span className="tabular-nums text-[var(--text-muted)]">{fmtSigned(n.pct_from_spot, 2, "%")}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-muted)]">
        {d.expiries} expiries, up to {d.max_dte ?? "—"} days. Compare levels with other sources, not totals.
      </p>
    </div>
  );
}

function IndexLayer({ s }: { s: DeskState }) {
  const b = s.breadth;
  const idx = s.baskets?.indexes ?? {};
  return (
    <Panel title="Index layer" subtitle={b ? `${b.universe_size} names, ${b.date}` : undefined}>
      {!b ? (
        <NotRun what="Breadth" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <PctBar label="% above 10-day" value={b.latest.pct_above_10} />
            <PctBar label="% above 20-day" value={b.latest.pct_above_20} />
            <PctBar label="% above 50-day" value={b.latest.pct_above_50} />
            <PctBar label="% above 100-day" value={b.latest.pct_above_100} />
            <PctBar label="% above 200-day" value={b.latest.pct_above_200} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 content-start">
            <Stat label="McClellan (ratio-adj.)" value={fmtSigned(b.mcclellan, 1)} className={signClass(b.mcclellan)} />
            <Stat label="Net new highs" value={fmtSigned(b.latest.net_new_highs, 0)} className={signClass(b.latest.net_new_highs)} />
            <Stat
              label="Hindenburg"
              value={
                !b.hindenburg || b.hindenburg.error ? (
                  <span className="text-[var(--text-muted)]">n/a</span>
                ) : b.hindenburg.confirmed ? (
                  <Chip tone="short">confirmed</Chip>
                ) : b.hindenburg.fired_today ? (
                  <Chip tone="caution">fired today</Chip>
                ) : (
                  <span className="text-[var(--text-muted)]">clear ({b.hindenburg.fires_in_window} in window)</span>
                )
              }
            />
            <Stat
              label="Zweig thrust"
              value={
                b.zweig_thrust?.days_ago == null ? (
                  "none on record"
                ) : b.zweig_thrust.days_ago <= ZWEIG_RECENT_SESSIONS ? (
                  <Chip tone="long">{b.zweig_thrust.days_ago} sessions ago</Chip>
                ) : (
                  <span className="text-[var(--text-muted)]">last {b.zweig_thrust.days_ago} sessions ago</span>
                )
              }
            />
            <Stat label="Adv / dec" value={`${b.latest.advances} / ${b.latest.declines}`} />
            <Stat label="Advancing share" value={`${fmtNum(b.latest.ad_ratio * 100, 1)}%`} />
          </dl>
        </div>
      )}
      {Object.keys(idx).length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs font-mono tabular-nums">
            <thead className="text-[var(--text-muted)] font-sans">
              <tr className="text-left">
                <th className="py-1 pr-3 font-normal">Index</th>
                <th className="py-1 pr-3 font-normal">EW 20d</th>
                <th className="py-1 pr-3 font-normal">CW 20d</th>
                <th className="py-1 pr-3 font-normal">EW − CW</th>
                <th className="py-1 pr-3 font-normal">EW &gt;50d</th>
                <th className="py-1 pr-3 font-normal">CW &gt;50d</th>
                <th className="py-1 font-normal">Weights as of</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(idx).map(([name, x]) => (
                <tr key={name} className="border-t border-[var(--border)]/50">
                  <td className="py-1 pr-3 font-sans font-semibold">{name}</td>
                  <td className={cn("py-1 pr-3", signClass(x.ew_ret_20d))}>{fmtSigned(x.ew_ret_20d, 2, "%")}</td>
                  <td className={cn("py-1 pr-3", signClass(x.cw_ret_20d))}>{fmtSigned(x.cw_ret_20d, 2, "%")}</td>
                  <td className={cn("py-1 pr-3", signClass(x.ew_minus_cw_20d))}>{fmtSigned(x.ew_minus_cw_20d, 2, " pts")}</td>
                  <td className="py-1 pr-3">{fmtNum(x.ew_pct_above_50)}%</td>
                  <td className="py-1 pr-3">{fmtNum(x.cw_pct_above_50)}%</td>
                  <td className="py-1 font-sans text-[var(--text-muted)]">{x.weights_as_of?.slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Cap weights are one market-cap snapshot applied to the whole window: right for today, not for history.
          </p>
        </div>
      )}
    </Panel>
  );
}

function MacroPanel({ s }: { s: DeskState }) {
  const m = s.macro_regime;
  const l = s.net_liquidity;
  const g = s.dollar_rates?.gold_gate;
  return (
    <Panel title="Macro & liquidity">
      <div className="space-y-4">
        {!m ? (
          <NotRun what="Macro regime" />
        ) : (
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm">Regime</span>
              <Chip tone={m.regime === "RISK-ON" ? "long" : m.regime === "RISK-OFF" ? "short" : "muted"}>
                {m.regime ?? "n/a"}
              </Chip>
              <span className="text-xs text-[var(--text-muted)]">
                {m.risk_on_count} of {m.rules_scored} rules risk-on
              </span>
            </div>
            <ul className="space-y-1">
              {m.rules.map((r) => (
                <li key={r.name} className="flex items-center gap-3 text-xs">
                  <span className="w-32 font-semibold">{r.name}</span>
                  <span className="w-36 font-mono text-[var(--text-muted)]">{r.rule}</span>
                  <span className={cn("font-mono tabular-nums", signClass(r.vs_average_pct ?? null))}>
                    {fmtSigned(r.vs_average_pct ?? null, 2, "%")}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {r.state ? `${r.state.toLowerCase()} ${r.sessions_in_state ?? ""}d` : "n/a"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="border-t border-[var(--border)] pt-3">
          {!l ? (
            <NotRun what="US net liquidity (needs FRED_API_KEY)" />
          ) : (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
              <Stat label="US net liquidity" value={`$${fmtNum(l.level_bn, 0)}B`} />
              <Stat label="1 week" value={fmtSigned(l.chg_1w_bn, 0, "B")} className={signClass(l.chg_1w_bn)} />
              <Stat label="4 weeks" value={fmtSigned(l.chg_4w_bn, 0, "B")} className={signClass(l.chg_4w_bn)} />
              <Stat
                label="State"
                value={
                  <Chip tone={l.state === "SUPPORTIVE" ? "long" : l.state === "UNSUPPORTIVE" ? "short" : "muted"}>
                    {l.state.toLowerCase()}
                  </Chip>
                }
              />
            </dl>
          )}
        </div>
        {g && (
          <div className="border-t border-[var(--border)] pt-3 flex items-center gap-3 text-sm flex-wrap">
            <span>Gold gate</span>
            <Chip tone={g.verdict === "TAILWIND" ? "long" : g.verdict === "HEADWIND" ? "short" : "muted"}>
              {g.verdict.toLowerCase()}
            </Chip>
            <span className="text-xs text-[var(--text-muted)]">
              real yield {fmtSigned(g.real_yield_chg_20d_bps, 0, " bps")} / dollar {fmtSigned(g.dxy_chg_20d_pct, 2, "%")} over 20 days
            </span>
          </div>
        )}
      </div>
    </Panel>
  );
}

const PLUMBING_TONE: Record<string, "long" | "short" | "caution" | "muted"> = {
  STRESS: "short",
  DRAINING: "caution",
  EASING: "long",
  NEUTRAL: "muted",
};

const FLAG_LABEL: Record<string, string> = {
  sofr_stress: "SOFR above IORB",
  effr_stress: "EFFR above IORB",
  repo_usage: "Fed repo usage",
  reserves_drain: "Reserves falling",
  tga_drain: "TGA rebuild, no RRP buffer",
};

function PlumbingPanel({ s }: { s: DeskState }) {
  const p = s.plumbing;
  return (
    <Panel
      title="US plumbing"
      subtitle={p ? `Liquidity layer 1 · rule v${p.rule_version} · as of ${p.as_of}` : undefined}
      right={
        <Link href="/research" className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
          Tested how? <ChevronRight className="h-3 w-3" />
        </Link>
      }
    >
      {!p ? (
        <NotRun what="US plumbing" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Chip tone={PLUMBING_TONE[p.state] ?? "muted"}>{p.state.toLowerCase()}</Chip>
            <span className="text-xs text-[var(--text-muted)]">
              {p.sessions_in_state} session{p.sessions_in_state === 1 ? "" : "s"} in state
            </span>
            {Object.entries(p.flags ?? {})
              .filter(([, on]) => on)
              .map(([k]) => (
                <Chip key={k} tone="caution">
                  {FLAG_LABEL[k] ?? k}
                </Chip>
              ))}
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
            <Stat label="Bank reserves" value={p.reserves_bn == null ? "—" : `$${fmtNum(p.reserves_bn, 0)}B`} />
            <Stat
              label="Reserves, 13 weeks"
              value={fmtSigned(p.reserves_chg13w_pct, 1, "%")}
              className={signClass(p.reserves_chg13w_pct)}
            />
            <Stat label="Treasury cash (TGA)" value={p.tga_bn == null ? "—" : `$${fmtNum(p.tga_bn, 0)}B`} />
            <Stat
              label="TGA, 20 sessions"
              value={fmtSigned(p.tga_chg20_bn, 0, "B")}
              className={signClass(p.tga_chg20_bn == null ? null : -p.tga_chg20_bn)}
            />
            <Stat
              label="SOFR − IORB (5d)"
              value={p.sofr_spread_5d_bp == null ? "—" : `${fmtSigned(p.sofr_spread_5d_bp, 1)} bp`}
              className={signClass(p.sofr_spread_5d_bp == null ? null : -p.sofr_spread_5d_bp)}
            />
            <Stat label="EFFR − IORB" value={p.effr_spread_bp == null ? "—" : `${fmtSigned(p.effr_spread_bp, 1)} bp`} />
            <Stat label="Reverse repo" value={p.rrp_bn == null ? "—" : `$${fmtNum(p.rrp_bn, 1)}B`} />
            <Stat label="Fed repo, 5d max" value={p.repo_5d_max_bn == null ? "—" : `$${fmtNum(p.repo_5d_max_bn, 1)}B`} />
          </dl>
          <p className="text-xs text-[var(--text-muted)]">
            A rising TGA drains reserves (shown red); SOFR above IORB means overnight funding is tight. Each value is
            as of its publication. TGA source: {p.tga_source ?? "—"}
            {p.tga_crosscheck?.median_abs_pct != null && ` (${p.tga_crosscheck.median_abs_pct}% median gap to FRED's weekly series)`}.
          </p>
        </div>
      )}
    </Panel>
  );
}

function WashoutPanel({ s }: { s: DeskState }) {
  const w = s.washout;
  return (
    <Panel title="Washout feed" subtitle={w ? `${w.rules.bb}; ${w.rules.rsi}` : undefined}>
      {!w ? (
        <NotRun what="Washout feed" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono tabular-nums">
            <thead className="text-[var(--text-muted)] font-sans">
              <tr className="text-left">
                <th className="py-1 pr-3 font-normal">Date</th>
                <th className="py-1 pr-3 font-normal">Under lower band</th>
                <th className="py-1 pr-3 font-normal">Percentile</th>
                <th className="py-1 pr-3 font-normal">RSI &lt; 30</th>
                <th className="py-1 font-normal">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {w.sessions.map((r) => (
                <tr key={r.date} className="border-t border-[var(--border)]/50">
                  <td className="py-1 pr-3">{r.date}</td>
                  <td className="py-1 pr-3">{r.bb_count} ({fmtNum(r.bb_share_pct)}%)</td>
                  <td className={cn("py-1 pr-3", r.bb_percentile >= 90 && "text-[var(--caution)] font-semibold")}>
                    {fmtNum(r.bb_percentile, 0)}
                  </td>
                  <td className="py-1 pr-3">{r.rsi_count} ({fmtNum(r.rsi_share_pct)}%)</td>
                  <td className={cn("py-1", (r.rsi_percentile ?? 0) >= 90 && "text-[var(--caution)] font-semibold")}>
                    {fmtNum(r.rsi_percentile, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function LeanCell({ leans, basket, k }: { leans: DeskLeans | null; basket: string; k: LeanKey }) {
  const v = leans?.leans?.[basket]?.[k];
  if (v == null) return <td className="py-1 pr-2 text-[var(--text-faint)]">—</td>;
  const printable = leans?.printable?.[k] ?? false;
  const strong = k === "crash20" ? v >= 30 : v >= 60;
  const weak = k === "crash20" ? false : v <= 40;
  return (
    <td
      className={cn(
        "py-1 pr-2",
        !printable && "text-[var(--text-faint)]",
        printable && strong && (k === "crash20" ? "text-[var(--short)]" : "text-[var(--long)]"),
        printable && weak && "text-[var(--short)]"
      )}
      title={printable ? undefined : "Below the validation bar: observation only"}
    >
      {fmtNum(v, 0)}
    </td>
  );
}

function BasketAtlas({ s }: { s: DeskState }) {
  const b = s.baskets;
  const leans = s.leans;
  if (!b) {
    return (
      <Panel title="Sector atlas">
        <NotRun what="Theme baskets" />
      </Panel>
    );
  }
  const anyPrintable = leans ? Object.values(leans.printable ?? {}).some(Boolean) : false;
  return (
    <Panel
      title="Sector atlas"
      subtitle={`${b.leaderboard.length} theme baskets ranked by breadth score (mean of % above 20- and 50-day)`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead className="text-[var(--text-muted)] font-sans">
            <tr className="text-left">
              <th className="py-1 pr-2 font-normal">#</th>
              <th className="py-1 pr-2 font-normal">Basket</th>
              <th className="py-1 pr-2 font-normal">Score</th>
              <th className="py-1 pr-2 font-normal">Δ rank 5/10/20</th>
              <th className="py-1 pr-2 font-normal">&gt;50d</th>
              <th className="py-1 pr-2 font-normal">&gt;200d</th>
              <th className="py-1 pr-2 font-normal">Oversold</th>
              <th className="py-1 pr-2 font-normal">Stress</th>
              <th className="py-1 pr-2 font-normal">5d</th>
              <th className="py-1 pr-2 font-normal">20d</th>
              {LEAN_KEYS.map((l) => (
                <th key={l.key} className="py-1 pr-2 font-normal">
                  {l.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.leaderboard.map((name) => {
              const x: DeskBasket | undefined = b.baskets[name];
              if (!x) return null;
              return (
                <tr key={name} className="border-t border-[var(--border)]/50">
                  <td className="py-1 pr-2 text-[var(--text-muted)]">{x.rank ?? "—"}</td>
                  <td className="py-1 pr-2 font-sans font-semibold whitespace-nowrap" title={x.missing.length ? `missing: ${x.missing.join(", ")}` : undefined}>
                    {name}
                    {x.missing.length > 0 && <span className="ml-1 text-[var(--text-faint)] font-normal">({x.members_used}/{x.members_total})</span>}
                  </td>
                  <td className="py-1 pr-2">{fmtNum(x.score, 0)}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {[x.rank_chg_5, x.rank_chg_10, x.rank_chg_20].map((c, i) => (
                      <span key={i} className={cn("mr-1", signClass(c))}>
                        {c == null ? "—" : `${c > 0 ? "+" : ""}${c}`}
                      </span>
                    ))}
                  </td>
                  <td className="py-1 pr-2">{fmtNum(x.pct_above_50, 0)}</td>
                  <td className="py-1 pr-2">{fmtNum(x.pct_above_200, 0)}</td>
                  <td className={cn("py-1 pr-2", (x.oversold ?? 0) >= 90 && "text-[var(--caution)]")}>{fmtNum(x.oversold, 0)}</td>
                  <td className={cn("py-1 pr-2", (x.stress ?? 0) >= 80 && "text-[var(--short)]")}>{fmtNum(x.stress, 0)}</td>
                  <td className={cn("py-1 pr-2", signClass(x.ret_5d))}>{fmtSigned(x.ret_5d, 1)}</td>
                  <td className={cn("py-1 pr-2", signClass(x.ret_20d))}>{fmtSigned(x.ret_20d, 1)}</td>
                  {LEAN_KEYS.map((l) => (
                    <LeanCell key={l.key} leans={leans} basket={name} k={l.key} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Leans (3/10/20-day: chance the basket beats SPY; crash: chance of a {"≥"}10% fall within 20 days) are
        observation only and never used to select or size.{" "}
        {anyPrintable
          ? "Coloured values cleared the validation bar; grey ones did not."
          : "None has cleared its validation bar yet, so all are grey."}{" "}
        <Link href="/research" className="text-[var(--accent)] hover:underline">
          See validation
        </Link>
      </p>
    </Panel>
  );
}

function ThesisStrip({ s }: { s: DeskState }) {
  const book = s.theses;
  if (!book) return null;
  return (
    <Panel
      title="Thesis book"
      right={
        <Link href="/theses" className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
          Rules and scorecard <ChevronRight className="h-3 w-3" />
        </Link>
      }
    >
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {book.theses.map((t) => (
          <li key={t.key} className="flex items-center justify-between gap-2 text-sm border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1.5">
            <span className="truncate">
              <span className="font-mono text-xs text-[var(--text-muted)] mr-1.5">{t.id}</span>
              {t.title}
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <Chip
                tone={
                  t.status === "CONFIRMED" ? "long" : t.status === "INVALIDATED" ? "short" : t.status === "BUILDING" ? "caution" : "muted"
                }
              >
                {t.status.toLowerCase()}
              </Chip>
              <span className="font-mono text-xs tabular-nums w-6 text-right">{t.conviction}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function DeskPage() {
  const { data, isLoading, error } = useDeskState();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-6 w-40 bg-[var(--bg-card)]" />
        <div className="h-64 bg-[var(--bg-card)]" />
        <div className="h-64 bg-[var(--bg-card)]" />
      </div>
    );
  }
  if (error && !isNotFound(error)) return <LoadError error={error} />;
  if (!data) {
    return <EmptyState title="No desk state generated yet" command="--desk-state" />;
  }

  const missing = Object.entries(data.inputs ?? {})
    .filter(([k, v]) => !v && !NOT_ENGINES.has(k))
    .map(([k]) => k.replaceAll("_", " "));
  const briefStale = data.inputs?.morning_brief && data.inputs?.morning_brief_is_tonight === false;

  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Desk</h1>
        <span className="text-sm text-[var(--text-muted)]">
          {data.date}
          {data.brief_date && data.brief_date !== data.date && ` · morning brief ${data.brief_date}`}
        </span>
      </header>

      {!data.is_today && <StaleBanner date={data.file_date} command="--desk-state" />}
      {missing.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">Not run tonight: {missing.join(", ")}.</p>
      )}
      {briefStale && (
        <p className="text-xs text-[var(--caution)]">
          The morning brief behind the header is from {data.brief_date ?? "an earlier day"}, not tonight.
        </p>
      )}

      <Panel title="Dealer positioning" subtitle="Net gamma changes skip partial nights (an expiry missing from the chain would read as a move).">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <DealerCard ticker="SPY" d={data.dealer?.SPY ?? null} />
          <DealerCard ticker="QQQ" d={data.dealer?.QQQ ?? null} />
        </div>
      </Panel>

      <ThesisStrip s={data} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <IndexLayer s={data} />
        <MacroPanel s={data} />
      </div>

      <PlumbingPanel s={data} />

      <BasketAtlas s={data} />

      <WashoutPanel s={data} />
    </div>
  );
}
