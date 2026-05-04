"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const STALE_5M = 5 * 60 * 1000;

const noRetryOn404 = (count: number, err: unknown) => {
  if (err instanceof Error && err.message.includes("404")) return false;
  return count < 1;
};

export function useFlowLeaders(limit?: number, sector?: string, enabled = true) {
  return useQuery({
    queryKey: ["flow-leaders", limit, sector],
    queryFn: () => api.flowLeaders(limit, sector),
    staleTime: STALE_5M,
    retry: noRetryOn404,
    enabled,
  });
}

export function useFlowExits(limit?: number, sector?: string, enabled = true) {
  return useQuery({
    queryKey: ["flow-exits", limit, sector],
    queryFn: () => api.flowExits(limit, sector),
    staleTime: STALE_5M,
    retry: noRetryOn404,
    enabled,
  });
}

export function useFlowMap(enabled = true) {
  return useQuery({
    queryKey: ["flow-map"],
    queryFn: () => api.flowMap(),
    staleTime: STALE_5M,
    retry: noRetryOn404,
    enabled,
  });
}

export function useSectorHistory(enabled = true) {
  return useQuery({
    queryKey: ["sector-history"],
    queryFn: () => api.sectorHistory(),
    staleTime: STALE_5M,
    retry: noRetryOn404,
    enabled,
  });
}

export function useRunFlowJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (options?: { include_cot?: boolean; include_etf_flows?: boolean }) =>
      api.triggerFlowJob(options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-leaders"] });
      qc.invalidateQueries({ queryKey: ["flow-exits"] });
      qc.invalidateQueries({ queryKey: ["flow-map"] });
      qc.invalidateQueries({ queryKey: ["sector-history"] });
    },
  });
}
