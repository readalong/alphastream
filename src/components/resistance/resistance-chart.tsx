"use client";

import { useResistanceChart } from "@/hooks/use-resistance-chart";

interface ResistanceChartProps {
  ticker: string;
  enabled?: boolean;
}

export function ResistanceChart({ ticker, enabled = true }: ResistanceChartProps) {
  const { data: chartUrl, isLoading, isError } = useResistanceChart(ticker, enabled);

  if (isLoading) {
    return (
      <div className="h-96 rounded-lg bg-[var(--bg-card)] animate-pulse flex items-center justify-center">
        <div className="text-sm text-[var(--text-muted)]">Loading chart...</div>
      </div>
    );
  }

  if (isError || !chartUrl) {
    return (
      <div className="h-96 rounded-lg bg-[var(--bg-card)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">
          Resistance chart unavailable
        </p>
      </div>
    );
  }

  return (
    <img
      src={chartUrl}
      alt={`${ticker} resistance chart`}
      className="w-full rounded-lg"
    />
  );
}
