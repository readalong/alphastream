"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { NewsFeedResponse, TickerNewsResponse } from "@/lib/types";
// TickerNewsResponse now uses TickerNewsArticle (yfinance + trafilatura)

export type NewsFeedType = "us" | "global";

export function useNewsFeed(feed: NewsFeedType, limit = 15, offset = 0) {
  return useQuery<NewsFeedResponse>({
    queryKey: ["news-feed", feed, limit, offset],
    queryFn: () => api.newsFeed(feed, limit, offset),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useTickerNews(ticker: string, enabled = true) {
  return useQuery<TickerNewsResponse>({
    queryKey: ["ticker-news", ticker],
    queryFn: () => api.tickerNews(ticker),
    staleTime: 15 * 60 * 1000,
    enabled: !!ticker && enabled,
    retry: false,
  });
}
