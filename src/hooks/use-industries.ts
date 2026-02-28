"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useIndustries(sectorEtf: string | null) {
  return useQuery({
    queryKey: ["industries", sectorEtf],
    queryFn: () => api.industries(sectorEtf || undefined),
    enabled: !!sectorEtf,
    staleTime: 5 * 60 * 1000,
  });
}
