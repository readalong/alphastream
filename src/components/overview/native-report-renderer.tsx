"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { MarketReport, InstrumentEntry } from "@/lib/types";

// ── Tile color palette ─────────────────────────────────────────────────────

const TILE_STYLES: Record<string, { border: string; bg: string; accent: string }> = {
  indigo:  { border: "#6366f1", bg: "rgba(99,102,241,0.07)",  accent: "#6366f1" },
  green:   { border: "#22c55e", bg: "rgba(34,197,94,0.07)",   accent: "#22c55e" },
  amber:   { border: "#f59e0b", bg: "rgba(245,158,11,0.07)",  accent: "#f59e0b" },
  cyan:    { border: "#06b6d4", bg: "rgba(6,182,212,0.07)",   accent: "#06b6d4" },
  red:     { border: "#ef4444", bg: "rgba(239,68,68,0.07)",   accent: "#ef4444" },
  purple:  { border: "#a855f7", bg: "rgba(168,85,247,0.07)",  accent: "#a855f7" },
  blue:    { border: "#3b82f6", bg: "rgba(59,130,246,0.07)",  accent: "#3b82f6" },
  emerald: { border: "#10b981", bg: "rgba(16,185,129,0.07)",  accent: "#10b981" },
};

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
  isGuidance?: boolean;
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
    cards.push({ title: "Trading Guidance", isGuidance: true, metrics });
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

function BadgeChip({ text, type }: { text: string; type?: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    bullish: { bg: "rgba(34,197,94,0.15)",   text: "#22c55e" },
    bearish: { bg: "rgba(239,68,68,0.15)",   text: "#ef4444" },
    neutral: { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b" },
    stage2:  { bg: "rgba(34,197,94,0.15)",   text: "#22c55e" },
    stage1:  { bg: "rgba(59,130,246,0.15)",  text: "#3b82f6" },
    stage3:  { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b" },
    stage4:  { bg: "rgba(239,68,68,0.15)",   text: "#ef4444" },
  };
  const c = colors[type || ""] || { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" };
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {text}
    </span>
  );
}

// ── MetricTile ─────────────────────────────────────────────────────────────

function MetricTile({ card, color }: { card: ParsedCard; color: string }) {
  const style = TILE_STYLES[color] || TILE_STYLES.indigo;
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{
        background: card.isGuidance
          ? "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.18) 100%)"
          : style.bg,
        borderLeft: `3px solid ${style.border}`,
      }}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.accent }}>
        {card.title}
      </h3>
      <div className="space-y-2">
        {card.metrics.map((m, i) => (
          <div
            key={i}
            className={m.isFullWidth ? "flex flex-col gap-0.5" : "flex items-center justify-between gap-2"}
          >
            <span className="text-[11px] text-[var(--text-muted)] shrink-0">{m.label}</span>
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
          <div className="h-full rounded-full" style={{ width: `${card.confidence}%`, background: style.accent }} />
        </div>
      )}
    </div>
  );
}

// ── SectorTile ─────────────────────────────────────────────────────────────

function SectorTile({ sectors }: { sectors: SectorData }) {
  const style = TILE_STYLES.emerald;
  return (
    <div
      className="rounded-lg p-4 md:col-span-2"
      style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: style.accent }}>
        Sector Rotation
      </h3>
      {sectors.summary && (
        <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">{sectors.summary}</p>
      )}
      <div className="flex flex-wrap gap-4">
        {sectors.leading.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-green-500 block mb-1.5">Leading</span>
            <div className="flex flex-wrap gap-1.5">
              {sectors.leading.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {sectors.lagging.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 block mb-1.5">Lagging</span>
            <div className="flex flex-wrap gap-1.5">
              {sectors.lagging.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{s}</span>
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
  const style = TILE_STYLES.blue;

  return (
    <div
      className="rounded-lg overflow-hidden md:col-span-2"
      style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:brightness-110 transition-all"
      >
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.accent }}>
          All Instruments ({instruments.length})
        </h3>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: style.accent }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
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
                <tr key={r.ticker} className="border-t border-[var(--border)]/30">
                  <td className="py-2 pr-3 font-semibold text-[var(--text-primary)]">
                    <Link href={`/ticker/${r.ticker}`} className="hover:text-[var(--accent)] transition-colors">
                      {r.ticker}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-[var(--text-muted)]">{r.name}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums text-[var(--text-primary)]">{r.price}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums" style={{ color: r.d1Positive ? "#22c55e" : "#ef4444" }}>{r.d1}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums" style={{ color: r.d5Positive ? "#22c55e" : "#ef4444" }}>{r.d5}</td>
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
            <MetricTile key={i} card={card} color={["indigo", "amber", "purple"][i % 3]} />
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
