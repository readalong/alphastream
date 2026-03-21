"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useEarnings(ticker: string, quarters = 8, enabled = true) {
  return useQuery({
    queryKey: ["earnings", ticker, quarters],
    queryFn: () => api.earnings(ticker, quarters),
    enabled,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours — matches backend cache TTL
    retry: (failureCount, error) => {
      // Don't retry on 422 (ETF/index without quarterly earnings)
      if (error instanceof Error && error.message.includes("422")) return false;
      return failureCount < 2;
    },
  });
}
