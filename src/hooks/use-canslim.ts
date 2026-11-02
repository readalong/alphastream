"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { BreakoutFilterParams, ActionsFilterParams } from "@/lib/types";

const STALE_7D = 7 * 24 * 60 * 60 * 1000;
const STALE_5M = 5 * 60 * 1000;

const noRetryOn404 = (count: number, err: unknown) => {
  if (err instanceof Error && err.message.includes("404")) return false;
  return count < 1;
};

/** Full CAN SLIM scorecard for a single ticker.
 *  staleTime 7 days — fundamentals cached server-side at same TTL. */
export function useCanslim(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["canslim", ticker],
    queryFn: () => api.canslim(ticker),
    enabled: enabled && !!ticker,
    staleTime: STALE_7D,
    retry: noRetryOn404,
  });
}

/** Breakout scanner — universe of tickers in or near an O'Neil base.
 *  staleTime 5 min — breakout positions can change intraday. */
export function useBreakouts(params: BreakoutFilterParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["canslim-breakouts", params],
    queryFn: () => api.breakouts(params),
    enabled,
    staleTime: STALE_5M,
    retry: noRetryOn404,
  });
}

/** Actionable signals from the pre-computed actions engine.
 *  staleTime 5 min — actions are computed once per CLI run. */
export function useActions(params: ActionsFilterParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["canslim-actions", params],
    queryFn: () => api.actions(params),
    enabled,
    staleTime: STALE_5M,
    retry: noRetryOn404,
  });
}

/** AI narrative for BUY/ALERT candidates.
 *  staleTime 5 min. Returns 404 if no data or 422 if no LLM key. */
export function useNarrative(enabled = true) {
  return useQuery({
    queryKey: ["canslim-narrative"],
    queryFn: () => api.narrative(),
    enabled,
    staleTime: STALE_5M,
    retry: noRetryOn404,
  });
}

/** Annotated O'Neil-style breakout chart (weekly or daily, base64 PNG).
 *  staleTime 7 days — chart only regenerates when new price data is downloaded. */
export function useBreakoutChart(
  ticker: string,
  timeframe: "weekly" | "daily" = "weekly",
  bars = 65,
  enabled = true
) {
  return useQuery({
    queryKey: ["canslim-chart", ticker, timeframe, bars],
    queryFn: () => api.breakoutChart(ticker, timeframe, bars),
    enabled: enabled && !!ticker,
    staleTime: STALE_7D,
    retry: noRetryOn404,
  });
}
