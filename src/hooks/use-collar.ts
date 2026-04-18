"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useCollarActive() {
  return useQuery({
    queryKey: ["collar-active"],
    queryFn: () => api.collarActive(),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });
}
