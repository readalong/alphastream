"use client";

/**
 * /options — the GEX alert center (Phase 2, docs/ALPHASTREAM_UX_REDESIGN.md
 * §3.3). The backend's most differentiated capability had no UI at all
 * before this page: dealer gamma exposure, the gamma flip, and the
 * breakout/ceiling/magnet/cascade level ladder.
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useGexAlerts } from "@/hooks/use-gex";
import { GlossaryLink } from "@/components/glossary-link";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { GexAlert, GexLevels } from "@/lib/types";

const UNIVERSE = ["SPY", "QQQ", "GLD", "SLV"] as const;

const REGIME_STYLE: Record<string, string> = {
  STABLE: "text-[var(--long)] bg-[var(--long)]/10 border-[var(--long)]/25",
  PINNED: "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/25",
  VOLATILE: "text-[var(--caution)] bg-[var(--caution)]/10 border-[var(--caution)]/25",
  SQUEEZE_PRONE: "text-[var(--short)] bg-[var(--short)]/10 border-[var(--short)]/25",
  UNKNOWN: "text-[var(--text-muted)] bg-[var(--bg-primary)] border-[var(--border)]",
};

function fmtDollars(v: number | null | undefined) {
  if (v == null) return "N/A";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtStrike(v: number | null | undefined) {
  return v == null ? "N/A" : `$${v.toLocaleString("en-US")}`;
}

/* ── Regime strip: one row per ticker, table not decorative cards — this
   is comparison data, best read across a shared axis. ── */
function RegimeStrip({
  alerts,
  active,
  onSelect,
}: {
  alerts: Record<string, GexAlert | null>;
  active: string;
  onSelect: (ticker: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
            <th className="text-left font-normal px-3 py-2">Ticker</th>
            <th className="text-left font-normal px-3 py-2">
              <GlossaryLink term="Gamma flip" className="hover:text-[var(--accent)]">
                Regime
              </GlossaryLink>
            </th>
            <th className="text-right font-normal px-3 py-2">
              <GlossaryLink term="GEX (gamma exposure)" className="hover:text-[var(--accent)]">
                Net GEX
              </GlossaryLink>
            </th>
            <th className="text-right font-normal px-3 py-2 hidden sm:table-cell">Gamma flip</th>
            <th className="text-right font-normal px-3 py-2 hidden sm:table-cell">Dealer bias</th>
          </tr>
        </thead>
        <tbody>
          {UNIVERSE.map((ticker) => {
            const alert = alerts[ticker];
            const isActive = ticker === active;
            return (
              <tr
                key={ticker}
                onClick={() => onSelect(ticker)}
                className={cn(
                  "cursor-pointer border-b border-[var(--border)] last:border-0 transition-colors",
                  isActive ? "bg-[var(--accent)]/10" : "hover:bg-[var(--bg-primary)]"
                )}
              >
                <td className="px-3 py-2 font-mono font-semibold text-[var(--text-primary)]">
                  {ticker}
                </td>
                <td className="px-3 py-2">
                  {alert ? (
                    <span
                      className={cn(
                        "inline-block text-xs font-semibold px-2 py-0.5 rounded border",
                        REGIME_STYLE[alert.regime.regime] ?? REGIME_STYLE.UNKNOWN
                      )}
                    >
                      {alert.regime.regime.replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">no snapshot today</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--text-primary)]">
                  {alert ? fmtDollars(alert.regime.net_gex) : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-[var(--text-primary)] hidden sm:table-cell">
                  {alert ? (alert.regime.flip_strike != null ? fmtStrike(alert.regime.flip_strike) : "no flip in chain") : "—"}
                </td>
                <td className="px-3 py-2 text-right hidden sm:table-cell">
                  {alert ? (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        alert.dealer_bias === "selling"
                          ? "text-[var(--short)]"
                          : alert.dealer_bias === "buying"
                            ? "text-[var(--long)]"
                            : "text-[var(--text-muted)]"
                      )}
                    >
                      {alert.dealer_bias}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Spatial level ladder: ceiling / breakout / spot / magnet / cascade,
   positioned by actual price so the reader sees the terrain, not a list
   of chips. ── */
function LevelLadder({ levels, spot }: { levels: GexLevels; spot: number }) {
  type Row = { key: keyof GexLevels | "spot"; label: string; price: number; tone: string };
  const rows: Row[] = [];

  if (levels.ceiling != null)
    rows.push({ key: "ceiling", label: "Ceiling", price: levels.ceiling, tone: "text-[var(--info)] border-[var(--info)]/25 bg-[var(--info)]/5" });
  if (levels.nearest_breakout != null)
    rows.push({ key: "nearest_breakout", label: "Breakout", price: levels.nearest_breakout, tone: "text-[var(--long)] border-[var(--long)]/25 bg-[var(--long)]/5" });
  rows.push({ key: "spot", label: "Spot", price: spot, tone: "text-[var(--accent)] border-[var(--accent)]/40 bg-[var(--accent)]/5 font-bold" });
  if (levels.magnet != null)
    rows.push({ key: "magnet", label: "Magnet", price: levels.magnet, tone: "text-[var(--info)] border-[var(--info)]/25 bg-[var(--info)]/5" });
  if (levels.cascade != null)
    rows.push({ key: "cascade", label: "Cascade", price: levels.cascade, tone: "text-[var(--short)] border-[var(--short)]/25 bg-[var(--short)]/5" });

  const sorted = rows.sort((a, b) => b.price - a.price);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-xs text-[var(--text-muted)] mb-3">
        <GlossaryLink term="Node ladder">Level ladder</GlossaryLink> — where price wants to go
      </p>
      <div className="space-y-1.5">
        {sorted.map((row) => (
          <div
            key={row.key}
            className={cn("flex items-center justify-between rounded border px-3 py-2 text-sm", row.tone)}
          >
            <span className="font-semibold">
              {row.key !== "spot" ? (
                <GlossaryLink
                  term={
                    row.key === "ceiling"
                      ? "Ceiling level"
                      : row.key === "nearest_breakout"
                        ? "Breakout level"
                        : "Magnet level"
                  }
                  className="hover:opacity-70"
                >
                  {row.label}
                </GlossaryLink>
              ) : (
                row.label
              )}
            </span>
            <span className="font-mono tabular-nums">{fmtStrike(row.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstrumentDetail({ alert, ticker }: { alert: GexAlert | null; ticker: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!alert) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          No dealer-flow snapshot for {ticker} today. Run{" "}
          <code className="font-mono text-[var(--text-primary)]">python main.py --gex-alert</code>{" "}
          on the backend (needs live options-chain access).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LevelLadder levels={alert.levels} spot={alert.spot} />

      {alert.proximity_alerts.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
          <p className="text-xs text-[var(--text-muted)] mb-1">Proximity alerts</p>
          {alert.proximity_alerts.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[var(--caution)]" />
              <span className="text-[var(--text-primary)]">
                Price is within {p.pct_away.toFixed(2)}% of {fmtStrike(p.strike)} ({p.direction}) —{" "}
                {p.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        {imgFailed ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            Heatmap unavailable for {ticker}.
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={api.gexHeatmapUrl(ticker)}
            alt={`${ticker} strike x expiry GEX/VEX/CEX/OI heatmap`}
            className="w-full rounded"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <p className="text-sm text-[var(--text-muted)]">{alert.summary}</p>
    </div>
  );
}

export default function OptionsPage() {
  const [active, setActive] = useState<string>("SPY");
  const { data, isLoading, error } = useGexAlerts();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-6 w-32 bg-[var(--bg-card)]" />
        <div className="h-40 bg-[var(--bg-card)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h1 className="text-base font-semibold text-[var(--text-primary)] mb-2">
          No GEX alerts available
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Run <code className="font-mono text-[var(--text-primary)]">python main.py --dealer-flow</code>{" "}
          on the backend first (needs live options-chain access).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Options</h1>
        <span className="text-sm text-[var(--text-muted)]">{data.date}</span>
      </header>

      {data.note && (
        <p className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-muted)]">
          {data.note}
        </p>
      )}

      <RegimeStrip alerts={data.alerts} active={active} onSelect={setActive} />

      <InstrumentDetail alert={data.alerts[active] ?? null} ticker={active} />
    </div>
  );
}
