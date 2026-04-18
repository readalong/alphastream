"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useCTAAll() {
  return useQuery({
    queryKey: ["cta-all"],
    queryFn: () => api.ctaAll(),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
