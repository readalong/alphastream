"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useMarketDirection() {
  return useQuery({
    queryKey: ["market-direction"],
    queryFn: () => api.marketDirection(),
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: false, // backend module not yet deployed — fail silently
  });
}
