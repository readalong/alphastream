"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useResistanceChart } from "@/hooks/use-resistance-chart";
import Link from "next/link";

interface ResistanceChartModalProps {
  ticker: string;
  onClose: () => void;
}

export function ResistanceChartModal({ ticker, onClose }: ResistanceChartModalProps) {
  const { data: chartUrl, isLoading, isError } = useResistanceChart(ticker);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl mx-4 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {ticker} — Resistance Chart
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="h-96 rounded-lg bg-[var(--bg-card)] animate-pulse" />
          ) : isError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Chart unavailable</p>
            </div>
          ) : chartUrl ? (
            <img
              src={chartUrl}
              alt={`${ticker} resistance chart`}
              className="w-full rounded-lg"
            />
          ) : null}
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <Link
            href={`/ticker/${ticker}?tab=resistance`}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
