"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { MarketReport, InstrumentEntry } from "@/lib/types";

// ── Internal display types ─────────────────────────────────────────────────

interface Metric {
  label: string;
  value: string;
  isBadge?: boolean;
  badgeType?: string;
  isFullWidth?: boolean;
}

interface ParsedCard {
  title: string;
  metrics: Metric[];
  confidence?: number;
}

interface SectorData {
  summary: string;
  leading: string[];
  lagging: string[];
}

interface InstrumentRow {
  ticker: string;
  name: string;
  type: string;
  price: string;
  d1: string;
  d1Positive: boolean;
  d5: string;
  d5Positive: boolean;
  vsSma: string;
  stage: string;
  stageType: string;
  signal: string;
}

// ── Badge type helpers ─────────────────────────────────────────────────────

function phaseToBadgeType(phase: string): string {
  const p = phase.toLowerCase();
  if (p.includes("bull")) return "bullish";
  if (p.includes("bear") || p.includes("correction")) return "bearish";
  return "neutral";
}

function stageToBadgeType(stage: string): string {
  if (stage.includes("2")) return "stage2";
  if (stage.includes("1")) return "stage1";
  if (stage.includes("3")) return "stage3";
  if (stage.includes("4")) return "stage4";
  return "";
}

function appetiteToBadgeType(a: string): string {
  if (a === "High") return "bullish";
  if (a === "Low") return "bearish";
  return "neutral";
}

function stanceToBadgeType(s: string): string {
  if (s === "Aggressive") return "bullish";
  if (s === "Defensive") return "bearish";
  return "neutral";
}

function sizingToBadgeType(s: string): string {
  if (s === "Full") return "bullish";
  if (s === "Minimal") return "bearish";
  return "neutral";
}

// ── JSON → display model mappers ───────────────────────────────────────────

function buildCards(report: MarketReport): ParsedCard[] {
  const cards: ParsedCard[] = [];
  const mr = report.market_regime;
  const ra = report.risk_assessment;
  const tg = report.trading_guidance;

  if (mr?.phase) {
    cards.push({
      title: "Market Regime",
      confidence: mr.confidence,
      metrics: [
        { label: "Phase",        value: mr.phase,               isBadge: true, badgeType: phaseToBadgeType(mr.phase) },
        { label: "Broad Market", value: mr.broad_market_stage,  isBadge: true, badgeType: stageToBadgeType(mr.broad_market_stage) },
      ],
    });
  }

  if (ra?.risk_appetite) {
    cards.push({
      title: "Risk Assessment",
      metrics: [
        { label: "Risk Appetite", value: ra.risk_appetite,    isBadge: true, badgeType: appetiteToBadgeType(ra.risk_appetite) },
        { label: "Crypto",        value: ra.crypto_signal,    isFullWidth: true },
        { label: "Commodities",   value: ra.commodity_signal, isFullWidth: true },
      ],
    });
  }

  if (tg?.stance) {
    const metrics: Metric[] = [
      { label: "Stance",           value: tg.stance,           isBadge: true, badgeType: stanceToBadgeType(tg.stance) },
      { label: "Position Sizing",  value: tg.position_sizing,  isBadge: true, badgeType: sizingToBadgeType(tg.position_sizing) },
    ];
    if (tg.sector_preference?.length)
      metrics.push({ label: "Prefer", value: tg.sector_preference.join(", "), isFullWidth: true });
    if (tg.sector_avoid?.length)
      metrics.push({ label: "Avoid", value: tg.sector_avoid.join(", "), isFullWidth: true });
    cards.push({ title: "Trading Guidance", metrics });
  }

  return cards;
}

function buildSectors(report: MarketReport): SectorData | null {
  const sa = report.sector_analysis;
  if (!sa?.rotation_signal && !sa?.leading_sectors?.length && !sa?.lagging_sectors?.length)
    return null;
  return {
    summary: sa.rotation_signal ?? "",
    leading: sa.leading_sectors ?? [],
    lagging: sa.lagging_sectors ?? [],
  };
}

function fmtPct(val: number | null): string {
  if (val == null) return "—";
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}

function fmtPrice(val: number | null): string {
  if (val == null) return "—";
  return val < 100 ? `$${val.toFixed(2)}` : `$${val.toFixed(0)}`;
}

function toRow(e: InstrumentEntry): InstrumentRow {
  return {
    ticker:      e.ticker,
    name:        e.name,
    type:        e.asset_type,
    price:       fmtPrice(e.close_price),
    d1:          fmtPct(e.pct_chg_1d),
    d1Positive:  (e.pct_chg_1d ?? 0) >= 0,
    d5:          fmtPct(e.pct_chg_5d),
    d5Positive:  (e.pct_chg_5d ?? 0) >= 0,
    vsSma:       e.sma200_position === "N/A" ? "—" : e.sma200_position,
    stage:       e.stage || "—",
    stageType:   stageToBadgeType(e.stage || ""),
    signal:      e.signals || "—",
  };
}

// ── BadgeChip ──────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<string, string> = {
  bullish: "bg-[var(--long)]/15 text-[var(--long)]",
  bearish: "bg-[var(--short)]/15 text-[var(--short)]",
  neutral: "bg-[var(--caution)]/15 text-[var(--caution)]",
  stage2:  "bg-[var(--long)]/15 text-[var(--long)]",
  stage1:  "bg-[var(--bg-primary)] text-[var(--text-muted)]",
  stage3:  "bg-[var(--caution)]/15 text-[var(--caution)]",
  stage4:  "bg-[var(--short)]/15 text-[var(--short)]",
};

function BadgeChip({ text, type }: { text: string; type?: string }) {
  const style = BADGE_STYLES[type ?? ""] ?? "bg-[var(--bg-primary)] text-[var(--text-muted)]";
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {text}
    </span>
  );
}

// ── MetricTile ─────────────────────────────────────────────────────────────

function MetricTile({ card }: { card: ParsedCard }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        {card.title}
      </h3>
      <div className="space-y-2">
        {card.metrics.map((m, i) => (
          <div
            key={i}
            className={m.isFullWidth ? "flex flex-col gap-0.5" : "flex items-center justify-between gap-2"}
          >
            <span className="text-xs text-[var(--text-muted)] shrink-0">{m.label}</span>
            {m.isBadge ? (
              <BadgeChip text={m.value} type={m.badgeType} />
            ) : (
              <span className={`text-sm font-semibold text-[var(--text-primary)] ${m.isFullWidth ? "text-xs font-normal leading-relaxed" : ""}`}>
                {m.value}
              </span>
            )}
          </div>
        ))}
      </div>
      {card.confidence != null && (
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${card.confidence}%` }} />
        </div>
      )}
    </div>
  );
}

// ── SectorTile ─────────────────────────────────────────────────────────────

function SectorTile({ sectors }: { sectors: SectorData }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 md:col-span-2">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
        Sector Rotation
      </h3>
      {sectors.summary && (
        <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">{sectors.summary}</p>
      )}
      <div className="flex flex-wrap gap-4">
        {sectors.leading.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[var(--long)] block mb-1.5">Leading</span>
            <div className="flex flex-wrap gap-1.5">
              {sectors.leading.map((s) => (
                <span key={s} className="px-2 py-0.5 text-xs font-medium bg-[var(--long)]/15 text-[var(--long)]">{s}</span>
              ))}
            </div>
          </div>
        )}
        {sectors.lagging.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[var(--short)] block mb-1.5">Lagging</span>
            <div className="flex flex-wrap gap-1.5">
              {sectors.lagging.map((s) => (
                <span key={s} className="px-2 py-0.5 text-xs font-medium bg-[var(--short)]/15 text-[var(--short)]">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── InstrumentsTable ───────────────────────────────────────────────────────

function InstrumentsTable({ instruments }: { instruments: InstrumentRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden md:col-span-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-primary)] transition-colors"
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          All instruments ({instruments.length})
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-xs text-[var(--text-muted)]">
                <th className="text-left font-medium py-2 pr-3">Ticker</th>
                <th className="text-left font-medium py-2 pr-3">Name</th>
                <th className="text-right font-medium py-2 pr-3">Price</th>
                <th className="text-right font-medium py-2 pr-3">1D</th>
                <th className="text-right font-medium py-2 pr-3">5D</th>
                <th className="text-left font-medium py-2 pr-3">vs 200SMA</th>
                <th className="text-left font-medium py-2 pr-3">Stage</th>
                <th className="text-left font-medium py-2">Signal</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((r) => (
                <tr key={r.ticker} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-3 font-semibold text-[var(--text-primary)]">
                    <Link href={`/ticker/${r.ticker}`} className="hover:text-[var(--accent)] transition-colors">
                      {r.ticker}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-[var(--text-muted)]">{r.name}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--text-primary)]">{r.price}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums" style={{ color: r.d1Positive ? "var(--long)" : "var(--short)" }}>{r.d1}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums" style={{ color: r.d5Positive ? "var(--long)" : "var(--short)" }}>{r.d5}</td>
                  <td className="py-2 pr-3 text-[var(--text-muted)]">{r.vsSma}</td>
                  <td className="py-2 pr-3"><BadgeChip text={r.stage} type={r.stageType} /></td>
                  <td className="py-2"><BadgeChip text={r.signal} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── NativeReportRenderer ───────────────────────────────────────────────────

export function NativeReportRenderer({ report }: { report: MarketReport }) {
  const cards       = useMemo(() => buildCards(report),                    [report]);
  const sectors     = useMemo(() => buildSectors(report),                  [report]);
  const instruments = useMemo(() => report.instruments?.map(toRow) ?? [],  [report]);

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      {report.executive_summary && (
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          {report.executive_summary}
        </p>
      )}

      {/* Metric tiles */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.map((card, i) => (
            <MetricTile key={i} card={card} />
          ))}
        </div>
      )}

      {/* Sector rotation + Instruments */}
      {(sectors || instruments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectors && <SectorTile sectors={sectors} />}
          {instruments.length > 0 && <InstrumentsTable instruments={instruments} />}
        </div>
      )}
    </div>
  );
}
