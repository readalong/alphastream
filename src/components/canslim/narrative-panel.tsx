"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NarrativeResponse } from "@/lib/types";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

interface NarrativePanelProps {
  data: NarrativeResponse | null | undefined;
  isLoading: boolean;
  error: unknown;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function NarrativePanel({ data, isLoading, error, onRegenerate, isRegenerating }: NarrativePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
        {[80, 100, 60].map((w, i) => (
          <div key={i} className="h-3.5 rounded animate-pulse bg-purple-500/10" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  const isNoKey = error instanceof Error && error.message.includes("422");
  const noData  = error instanceof Error && error.message.includes("404");

  // Nothing to show if no data and no informative error
  if (!data && !isNoKey && !noData && !error) return null;

  const summaryText = data
    ? `${data.candidate_count} candidates · ${data.tickers.slice(0, 4).join(", ")}${data.tickers.length > 4 ? "…" : ""}`
    : "unavailable";

  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="h-4 w-4 text-purple-400 shrink-0" />
          {collapsed ? (
            <span className="text-sm text-[var(--text-muted)] truncate">
              AI Narrative · {summaryText}
            </span>
          ) : (
            <span className="text-sm font-semibold text-purple-300">AI Narrative</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-purple-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
            {isRegenerating ? "Generating…" : "Regenerate"}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-3 border-t border-purple-500/10 space-y-3">
          {isNoKey && (
            <div className="flex items-start gap-2 text-sm text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              Enter a Gemini API key in Settings to generate the narrative.
            </div>
          )}
          {noData && !isNoKey && (
            <p className="text-sm text-[var(--text-muted)]">No BUY/ALERT candidates to generate narrative for.</p>
          )}
          {!data && !!error && !isNoKey && !noData && (
            <p className="text-sm text-[var(--text-muted)]">Narrative unavailable.</p>
          )}
          {data && (
            <>
              {data.market_context && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-purple-400 mb-1">Market Context</p>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{data.market_context}</p>
                </div>
              )}
              {data.buy_analysis && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#39d353] mb-1">BUY Candidates</p>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{data.buy_analysis}</p>
                </div>
              )}
              {data.alert_analysis && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#f59e0b] mb-1">Alert Candidates</p>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{data.alert_analysis}</p>
                </div>
              )}
              {data.risk_notes && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#ff4d6d] mb-1">Risk Notes</p>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{data.risk_notes}</p>
                </div>
              )}
              <p className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-purple-500/10">
                Generated: {formatTime(data.generated_at)}
                {" · "}
                {data.source === "on_demand"
                  ? <span className="text-purple-300">generated on demand</span>
                  : "pre-generated"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
