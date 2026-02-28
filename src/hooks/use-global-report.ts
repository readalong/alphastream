"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { GlobalMarketReport } from "@/lib/types";

export function useGlobalReport(sessionId?: string) {
  return useQuery<GlobalMarketReport>({
    queryKey: ["globalReport", sessionId ?? "latest"],
    queryFn: () =>
      sessionId ? api.globalReportBySession(sessionId) : api.globalReport(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
