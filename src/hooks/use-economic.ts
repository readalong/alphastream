"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useEconomicCalendar(week?: string) {
  return useQuery({
    queryKey: ["economic-calendar", week ?? "current"],
    queryFn: () => api.economicCalendar(week),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEconomicData(week?: string) {
  return useQuery({
    queryKey: ["economic-data", week ?? "current"],
    queryFn: () => api.economicData(week),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours — matches backend cache TTL
  });
}
