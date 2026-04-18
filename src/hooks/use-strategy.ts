"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const STALE_10M = 10 * 60 * 1000;
const noRetry = false;

export function useDailyStrategy() {
  return useQuery({
    queryKey: ["strategy"],
    queryFn: () => api.strategy(),
    staleTime: STALE_10M,
    retry: noRetry,
  });
}

export function useStrategyShorts() {
  return useQuery({
    queryKey: ["strategy-shorts"],
    queryFn: () => api.strategyShorts(),
    staleTime: STALE_10M,
    retry: noRetry,
  });
}

export function useStrategyHedges() {
  return useQuery({
    queryKey: ["strategy-hedges"],
    queryFn: () => api.strategyHedges(),
    staleTime: STALE_10M,
    retry: noRetry,
  });
}

export function useStrategyAllocation() {
  return useQuery({
    queryKey: ["strategy-allocation"],
    queryFn: () => api.strategyAllocation(),
    staleTime: STALE_10M,
    retry: noRetry,
  });
}

export function useStrategyBR() {
  return useQuery({
    queryKey: ["strategy-br"],
    queryFn: () => api.strategyBR(),
    staleTime: STALE_10M,
    retry: noRetry,
  });
}

export function useStrategyIntermarket() {
  return useQuery({
    queryKey: ["strategy-intermarket"],
    queryFn: () => api.strategyIntermarket(),
    staleTime: 0, // always fresh — no cache per backend docs
    retry: noRetry,
  });
}

export function useRunStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.runStrategy(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy"] });
      queryClient.invalidateQueries({ queryKey: ["strategy-shorts"] });
      queryClient.invalidateQueries({ queryKey: ["strategy-hedges"] });
      queryClient.invalidateQueries({ queryKey: ["strategy-allocation"] });
      queryClient.invalidateQueries({ queryKey: ["strategy-br"] });
    },
  });
}
