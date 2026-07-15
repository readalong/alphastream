"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { StageBadge } from "@/components/charts/stage-badge";
import { cn, formatPrice, parseCategory, parseSignals } from "@/lib/utils";
import type { ScreenerResult } from "@/lib/types";

interface TickerDrawerProps {
  ticker: string | null;
  screener: ScreenerResult | null;
  onClose: () => void;
}

export function TickerDrawer({ ticker, screener, onClose }: TickerDrawerProps) {
  useEffect(() => {
    if (!ticker) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [ticker, onClose]);

  if (!ticker || !screener) return null;

  const cat = parseCategory(screener.category);
  const signals = parseSignals(screener.signals);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-80 flex flex-col border-l border-[var(--border)] bg-[var(--bg-card)] shadow-lg animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono">{ticker}</h2>
            <StageBadge category={cat} />
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/ticker/${ticker}`}
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Full detail page"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Price" value={`$${formatPrice(screener.close_price)}`} />
            <Metric label="Stage" value={screener.stage} />
            <Metric label="Category" value={screener.category} highlight />
          </div>

          {/* Sector / Industry */}
          {screener.sector && (
            <div className="space-y-1.5">
              <p className="text-xs text-[var(--text-muted)] font-semibold">Location</p>
              <div className="space-y-1">
                <Link
                  href={`/sectors/${screener.sector_etf}`}
                  onClick={onClose}
                  className="block text-sm text-[var(--accent)] hover:underline"
                >
                  {screener.sector} ({screener.sector_etf})
                </Link>
                {screener.industry && (
                  <Link
                    href={`/sectors/${screener.sector_etf}/${encodeURIComponent(screener.industry)}`}
                    onClick={onClose}
                    className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors truncate"
                  >
                    {screener.industry}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Signals */}
          {signals.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-[var(--text-muted)] font-semibold">Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {signals.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded text-xs bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-[var(--border)]">
          <Link
            href={`/ticker/${ticker}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors text-sm font-medium"
          >
            Full detail page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", highlight ? "text-[var(--accent)]" : "text-[var(--text-primary)]")}>
        {value}
      </p>
    </div>
  );
}
