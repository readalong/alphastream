"use client";

import { useState } from "react";
import { useJobWithPolling, useJobStatus } from "@/hooks/use-job";
import { timeAgo } from "@/lib/utils";
import {
  Download,
  ScanSearch,
  BarChart3,
  Brain,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import type { JobStatusResponse } from "@/lib/types";

const JOB_CONFIGS = [
  {
    type: "download",
    title: "Download Data",
    description: "Download OHLCV data for all universe tickers",
    icon: Download,
  },
  {
    type: "screen",
    title: "Bulk Screen",
    description: "Run technical screener on all downloaded data",
    icon: ScanSearch,
  },
  {
    type: "indexes",
    title: "Index Analysis",
    description: "Analyze indices, sectors, crypto, commodities",
    icon: BarChart3,
  },
  {
    type: "indexes-ai",
    title: "Index + AI",
    description: "Index analysis with AI-powered market synthesis",
    icon: Brain,
  },
  {
    type: "global-indexes",
    title: "Global Indexes",
    description: "Screen 7 international indices (Asia Pacific + Europe)",
    icon: Globe,
  },
  {
    type: "global-indexes-ai",
    title: "Global Indexes + AI",
    description: "Global index screening with AI synthesis",
    icon: Globe,
  },
];

function JobResultSummary({
  type,
  result,
}: {
  type: string;
  result: Record<string, unknown>;
}) {
  const parts: string[] = [];

  if (type === "indexes-ai" || type === "indexes") {
    if (result.instruments_analyzed != null)
      parts.push(`${result.instruments_analyzed} instruments`);
    if (type === "indexes-ai")
      parts.push(result.ai_success ? "AI ✓" : "AI ✗");
  } else if (type === "global-indexes-ai" || type === "global-indexes") {
    if (result.instruments_analyzed != null)
      parts.push(`${result.instruments_analyzed} global indices`);
    if (type === "global-indexes-ai")
      parts.push(result.ai_success ? "AI ✓" : "AI ✗");
  } else if (type === "screen") {
    if (result.tickers_screened != null)
      parts.push(`${result.tickers_screened} screened`);
    if (result.session) parts.push(String(result.session));
  } else if (type === "download") {
    if (result.tickers_processed != null)
      parts.push(`${result.tickers_processed} tickers`);
  } else {
    return (
      <span className="text-xs text-[var(--long)] ml-auto truncate max-w-48">
        {JSON.stringify(result).substring(0, 60)}
      </span>
    );
  }

  return (
    <span className="text-xs text-[var(--long)] ml-auto whitespace-nowrap">
      {parts.join(" · ")}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-[var(--text-muted)]" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-[var(--info)] animate-spin" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-[var(--long)]" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-[var(--short)]" />;
    default:
      return null;
  }
}

function JobTriggerCard({
  type,
  title,
  description,
  icon: Icon,
}: {
  type: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  const { startJob, status, activeJobId, trigger, completionMessage } = useJobWithPolling(type);
  const isRunning =
    status.data?.status === "pending" || status.data?.status === "running";
  const isPending = trigger.isPending;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-md bg-[var(--accent)]/10">
          <Icon className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="font-medium text-[var(--text-primary)]">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        </div>
      </div>

      {activeJobId && status.data && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-[var(--bg-primary)]">
          <StatusIcon status={status.data.status} />
          <span className="text-xs text-[var(--text-muted)] capitalize">
            {status.data.status}
          </span>
          {status.data.status === "completed" && status.data.result && (
            <JobResultSummary type={type} result={status.data.result} />
          )}
          {status.data.error && (
            <span className="text-xs text-[var(--short)] ml-auto truncate max-w-48">
              {status.data.error}
            </span>
          )}
        </div>
      )}

      {completionMessage && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-[var(--long)]/10 border border-[var(--long)]/20">
          <CheckCircle className="h-3.5 w-3.5 text-[var(--long)] flex-shrink-0" />
          <span className="text-xs text-[var(--long)]">{completionMessage}</span>
        </div>
      )}

      <button
        onClick={() => startJob()}
        disabled={isRunning || isPending}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isPending || isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isRunning ? "Running..." : "Starting..."}
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Trigger
          </>
        )}
      </button>
    </div>
  );
}

export default function JobsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        Jobs
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {JOB_CONFIGS.map((config) => (
          <JobTriggerCard key={config.type} {...config} />
        ))}
      </div>
    </div>
  );
}
