import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { OHLCVPeriod } from "@/lib/types";

export function useOHLCV(ticker: string, period: OHLCVPeriod = "1y") {
  return useQuery({
    queryKey: ["ohlcv", ticker, period],
    queryFn: () => api.ohlcv(ticker, period),
    staleTime: 60 * 60 * 1000, // 1 hour — matches server cache
    enabled: !!ticker,
  });
}
