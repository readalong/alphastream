"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAnalyze(ticker: string, enabled = false) {
  return useQuery({
    queryKey: ["analyze", ticker],
    queryFn: () => api.analyze(ticker),
    enabled: enabled && !!ticker,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
