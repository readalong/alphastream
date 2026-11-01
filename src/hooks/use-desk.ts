"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/* Desk brief data. Every endpoint is file-backed on the engine and 404s with
   the command that produces it, so retry is off and a 404 renders as an
   actionable empty state rather than an error. */

const FIVE_MIN = 5 * 60 * 1000;

export function useDeskState() {
  return useQuery({ queryKey: ["desk-state"], queryFn: () => api.deskState(),
    staleTime: FIVE_MIN, refetchInterval: FIVE_MIN, retry: false });
}

export function useDeskSeries(days = 60) {
  return useQuery({ queryKey: ["desk-series", days], queryFn: () => api.deskSeries(days),
    staleTime: FIVE_MIN, retry: false });
}

export function useTheses() {
  return useQuery({ queryKey: ["theses"], queryFn: () => api.theses(),
    staleTime: FIVE_MIN, refetchInterval: FIVE_MIN, retry: false });
}

export function useThesisHistory() {
  return useQuery({ queryKey: ["thesis-history"], queryFn: () => api.thesisHistory(),
    staleTime: 60 * 60 * 1000, retry: false });
}

export function useRankerReport() {
  return useQuery({ queryKey: ["ranker-report"], queryFn: () => api.rankerReport(),
    staleTime: 60 * 60 * 1000, retry: false });
}

export function useLeansReport() {
  return useQuery({ queryKey: ["leans-report"], queryFn: () => api.leansReport(),
    staleTime: 60 * 60 * 1000, retry: false });
}
