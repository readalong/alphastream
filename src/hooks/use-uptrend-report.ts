"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useUptrendReport(sessionId: string | null) {
  return useQuery({
    queryKey: ["uptrend-report", sessionId],
    queryFn: () => api.uptrendReport(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}
