"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.sessions(),
    staleTime: 60 * 1000,
  });
}

export function useSessionReport(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ["session-report", sessionId],
    queryFn: () => api.sessionReport(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 30 * 60 * 1000,
  });
}
