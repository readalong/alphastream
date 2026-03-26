"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { AddPositionRequest } from "@/lib/types";

const STALE_30M = 30 * 60 * 1000;

const noRetryOn404 = (count: number, err: unknown) => {
  if (err instanceof Error && err.message.includes("404")) return false;
  return count < 1;
};

export function useRegime(enabled = true) {
  return useQuery({
    queryKey: ["regime"],
    queryFn: () => api.regime(),
    enabled,
    staleTime: STALE_30M,
    retry: noRetryOn404,
  });
}

export function useSectorRankings(enabled = true) {
  return useQuery({
    queryKey: ["sector-rankings"],
    queryFn: () => api.sectorRankings(),
    enabled,
    staleTime: STALE_30M,
    retry: noRetryOn404,
  });
}

export function usePortfolioHealth(refreshKey?: number) {
  return useQuery({
    queryKey: ["portfolio-health", refreshKey],
    queryFn: () => api.portfolioHealth(),
    staleTime: 5 * 60 * 1000,
    retry: noRetryOn404,
  });
}

export function useOpenPositions(refreshKey?: number) {
  return useQuery({
    queryKey: ["open-positions", refreshKey],
    queryFn: () => api.positions(),
    staleTime: 5 * 60 * 1000,
    retry: noRetryOn404,
  });
}

export function usePendingBreakouts(enabled = true) {
  return useQuery({
    queryKey: ["pending-breakouts"],
    queryFn: () => api.pendingBreakouts(),
    enabled,
    staleTime: STALE_30M,
    retry: noRetryOn404,
  });
}

/** date = "YYYYMMDD" or undefined for today */
export function useRecommendations(date?: string) {
  return useQuery({
    queryKey: ["recommendations", date ?? "today"],
    queryFn: () => api.recommendations(date),
    staleTime: STALE_30M,
    retry: noRetryOn404,
  });
}

export function useRecommendationHistory(days = 5, cursor?: string, enabled = true) {
  return useQuery({
    queryKey: ["recommendation-history", days, cursor ?? ""],
    queryFn: () => api.recommendationHistory(days, cursor),
    enabled,
    staleTime: STALE_30M,
    retry: false, // new endpoint, may not exist yet
  });
}

export function useRunRecommend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      portfolioValue,
      sector,
      regimeMode,
    }: {
      portfolioValue?: number;
      sector?: string;
      regimeMode?: string;
    } = {}) => api.runRecommend(portfolioValue, sector, regimeMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["recommendation-history"] });
      queryClient.invalidateQueries({ queryKey: ["regime"] });
      queryClient.invalidateQueries({ queryKey: ["pending-breakouts"] });
    },
  });
}

export function useAddPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddPositionRequest) => api.addPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-health"] });
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticker,
      exitPrice,
      exitReason,
    }: {
      ticker: string;
      exitPrice?: number;
      exitReason?: string;
    }) => api.closePosition(ticker, exitPrice, exitReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-health"] });
    },
  });
}
