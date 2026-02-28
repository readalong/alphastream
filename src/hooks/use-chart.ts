"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useChart(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["chart", ticker],
    queryFn: () => api.chart(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000,
  });
}
