"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/** Today's plain-English digest — the landing page's data source.
 *  A 404 means no digest has been generated yet (surfaced as an
 *  actionable empty state, not an error). */
export function useDigest() {
  return useQuery({
    queryKey: ["digest"],
    queryFn: () => api.digest(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}

/** The live forward track record — powers the permanent honesty footer. */
export function useScorecard() {
  return useQuery({
    queryKey: ["scorecard"],
    queryFn: () => api.scorecard(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
