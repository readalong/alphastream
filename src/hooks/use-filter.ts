"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { FilterParams } from "@/lib/types";

const noRetryOn404 = (count: number, err: unknown) => {
  if (err instanceof Error && err.message.includes("404")) return false;
  return count < 1;
};

export function useFilterSetup(params?: FilterParams, enabled = true) {
  return useQuery({
    queryKey: ["filter-setup", params],
    queryFn: () => api.filterSetup(params),
    staleTime: 5 * 60 * 1000,
    retry: noRetryOn404,
    enabled,
  });
}
