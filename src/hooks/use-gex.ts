"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/** GEX alerts for the full dealer-flow universe (SPY/QQQ/GLD/SLV) or one
 *  ticker. A null value under `.alerts[ticker]` means no snapshot today —
 *  not an error, an abstention (see `.note`). */
export function useGexAlerts(ticker?: string) {
  return useQuery({
    queryKey: ["gex-alerts", ticker ?? "all"],
    queryFn: () => api.gexAlerts(ticker),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Raw dealer-flow snapshot for one ticker — powers the /options level
 *  ladder. 404s (no snapshot today) surface via `error`, not a thrown
 *  render error. */
export function useDealerFlow(ticker: string) {
  return useQuery({
    queryKey: ["dealer-flow", ticker],
    queryFn: () => api.dealerFlow(ticker),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
