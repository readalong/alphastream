"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSessions, useSessionReport } from "@/hooks/use-sessions";
import { formatSessionDate, formatTime, isTodaySession } from "@/lib/utils";
import { Download, CheckCircle, XCircle, BarChart3, Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import { SECTOR_ETF_NAMES } from "@/lib/constants";
import { NativeReportRenderer } from "@/components/overview/native-report-renderer";
import type { SectorRunInfo } from "@/lib/types";

function TodayBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--long)]/15 text-[var(--long)] border border-[var(--long)]/25">
      Today
    </span>
  );
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const { data: sessions } = useSessions();
  const session = sessions?.find((s) => s.session_id === sessionId);
  const { data: report, isLoading: reportLoading } = useSessionReport(
    sessionId,
    !!session?.has_ai_analysis
  );
  const { data: sectorRuns } = useQuery({
    queryKey: ["sector-runs", sessionId],
    queryFn: () => api.sectorRuns(sessionId),
    staleTime: 5 * 60 * 1000,
    enabled: !!sessionId,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {formatSessionDate(sessionId)}
          </h1>
          {isTodaySession(sessionId) && <TodayBadge />}
        </div>
        <a
          href={api.sessionDownload(sessionId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download ZIP
        </a>
      </div>

      {/* Metadata */}
      {session && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Last Updated</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {formatTime(session.created_at)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Charts</p>
            <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
              {session.chart_count}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Screener Output</p>
            {session.has_screener_output ? (
              <CheckCircle className="h-5 w-5 text-[var(--long)]" />
            ) : (
              <XCircle className="h-5 w-5 text-[var(--text-muted)]" />
            )}
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Index Data</p>
            {session.has_index_data ? (
              <CheckCircle className="h-5 w-5 text-[var(--long)]" />
            ) : (
              <XCircle className="h-5 w-5 text-[var(--text-muted)]" />
            )}
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">AI Analysis</p>
            {session.has_ai_analysis ? (
              <CheckCircle className="h-5 w-5 text-[var(--long)]" />
            ) : (
              <XCircle className="h-5 w-5 text-[var(--text-muted)]" />
            )}
          </div>
        </div>
      )}

      {/* AI Report */}
      {session?.has_ai_analysis && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            AI market report
          </h2>
          {reportLoading ? (
            <div className="h-96 rounded bg-[var(--bg-primary)]" />
          ) : report ? (
            <NativeReportRenderer report={report} />
          ) : (
            <p className="text-[var(--text-muted)]">Report not available</p>
          )}
        </div>
      )}

      {/* Sector Runs */}
      {sectorRuns && sectorRuns.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)]">
            <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Sector Runs
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {sectorRuns.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border)]/50">
                <th className="text-left font-medium px-5 py-2">Sector</th>
                <th className="text-right font-medium px-5 py-2">Screened</th>
                <th className="text-right font-medium px-5 py-2">Charts</th>
                <th className="px-5 py-2 w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {sectorRuns.map((run: SectorRunInfo) => {
                const etf = run.filter_name.replace("sector_", "").toUpperCase();
                const name = SECTOR_ETF_NAMES[etf] || run.filter_name;
                return (
                  <tr
                    key={run.filter_name}
                    className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-primary)]/40 transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <div>
                        <span className="font-medium text-[var(--text-primary)]">
                          {name}
                        </span>
                        <span className="ml-2 text-xs text-[var(--text-muted)]">
                          {etf}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span className="font-mono tabular-nums text-[var(--text-primary)]">
                        {run.screen_files.length}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span className="font-mono tabular-nums text-[var(--text-primary)]">
                        {run.chart_count}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Link
                        href={`/sectors/${etf}`}
                        className="inline-flex items-center justify-center h-6 w-6 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                        title={`View ${name}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
