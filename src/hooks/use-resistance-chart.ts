"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useResistanceChart(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["resistance-chart", ticker],
    queryFn: () => api.resistanceChart(ticker),
    enabled: enabled && !!ticker,
    staleTime: 10 * 60 * 1000,
  });
}
