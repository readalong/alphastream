"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useSectorTickers(sectorEtf: string, enabled = true) {
  return useQuery({
    queryKey: ["sector-tickers", sectorEtf],
    queryFn: () => api.sectorTickers(sectorEtf),
    enabled: enabled && !!sectorEtf,
    staleTime: 5 * 60 * 1000,
  });
}
