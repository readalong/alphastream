"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/** Today's futures plan — bias/tier/action/setups per instrument. */
export function useFuturesPlan() {
  return useQuery({
    queryKey: ["futures-plan"],
    queryFn: () => api.futuresPlan(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
