"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/** Latest graded backtest review per engine (futures, breakout). */
export function useBacktestReviews() {
  return useQuery({
    queryKey: ["backtest-reviews"],
    queryFn: () => api.backtestReviews(),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}
