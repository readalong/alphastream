"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useResistance(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["resistance", ticker],
    queryFn: () => api.resistance(ticker),
    enabled: enabled && !!ticker,
    staleTime: 10 * 60 * 1000,
  });
}
