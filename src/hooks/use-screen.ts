"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useScreen(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["screen", ticker],
    queryFn: () => api.screen(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBatchScreen(tickers: string[], enabled = true) {
  return useQuery({
    queryKey: ["batch-screen", tickers.join(",")],
    queryFn: () => api.batchScreen(tickers),
    enabled: enabled && tickers.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
