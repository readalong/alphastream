"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { OpportunitiesUniverse } from "@/lib/types";

/**
 * Powers /opportunities (docs/ALPHASTREAM_OPPORTUNITIES_UI.md). The backend
 * caches /api/opportunities/both per day per universe — a cache-miss full
 * sp500 scan takes a few minutes, so `rescan()` is a separate imperative
 * action (refresh=1) rather than something a normal refetch/page load
 * ever does.
 */
export function useOpportunities(universe: OpportunitiesUniverse, top = 15) {
  const queryClient = useQueryClient();
  const [isRescanning, setIsRescanning] = useState(false);

  const query = useQuery({
    queryKey: ["opportunities", universe, top],
    queryFn: () => api.opportunities(universe, top, false),
    staleTime: 60 * 60 * 1000, // backend's own per-day cache is the real TTL
    retry: false,
  });

  const rescan = useCallback(async () => {
    setIsRescanning(true);
    try {
      const fresh = await api.opportunities(universe, top, true);
      queryClient.setQueryData(["opportunities", universe, top], fresh);
    } finally {
      setIsRescanning(false);
    }
  }, [queryClient, universe, top]);

  return { ...query, rescan, isRescanning };
}
