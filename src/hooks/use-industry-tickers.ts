"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useIndustryTickers(industry: string, enabled = true) {
  return useQuery({
    queryKey: ["industry-tickers", industry],
    queryFn: () => api.industryTickers(industry),
    enabled: enabled && !!industry,
    staleTime: 5 * 60 * 1000,
  });
}
