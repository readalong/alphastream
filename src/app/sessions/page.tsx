"use client";

import Link from "next/link";
import { useSessions } from "@/hooks/use-sessions";
import { formatSessionDate, formatTime, isTodaySession } from "@/lib/utils";
import { FolderOpen, Download, Eye, CheckCircle, XCircle } from "lucide-react";

function TodayBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
      Today
    </span>
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        Daily Sessions
      </h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-card)]">
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--text-muted)]">Last Updated</th>
                <th className="text-center px-4 py-2.5 font-medium text-[var(--text-muted)]">Screener</th>
                <th className="text-center px-4 py-2.5 font-medium text-[var(--text-muted)]">Index</th>
                <th className="text-center px-4 py-2.5 font-medium text-[var(--text-muted)]">Charts</th>
                <th className="text-center px-4 py-2.5 font-medium text-[var(--text-muted)]">AI</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="border-t border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {isTodaySession(s.session_id) && <TodayBadge />}
                      <span className="text-[var(--text-primary)]">
                        {formatSessionDate(s.session_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">
                    {formatTime(s.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {s.has_screener_output ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--text-muted)] mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {s.has_index_data ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--text-muted)] mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono tabular-nums text-[var(--text-primary)]">
                    {s.chart_count}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {s.has_ai_analysis ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--text-muted)] mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/sessions/${s.session_id}`}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)]"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/sessions/${s.session_id}/download`}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)]"
                        title="Download ZIP"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <FolderOpen className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No sessions found</p>
        </div>
      )}
    </div>
  );
}
