"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: () => api.sectors(),
    staleTime: 5 * 60 * 1000,
  });
}
