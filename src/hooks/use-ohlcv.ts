import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { OHLCVPeriod } from "@/lib/types";

export function useOHLCV(ticker: string, period: OHLCVPeriod = "1y") {
  return useQuery({
    queryKey: ["ohlcv", ticker, period],
    queryFn: () => api.ohlcv(ticker, period),
    staleTime: 60 * 60 * 1000, // 1 hour — matches server cache
    enabled: !!ticker,
    // Keep the prior period's bars mounted while a new period fetches —
    // switching periods must never unmount CandlestickChart, or the
    // lightweight-charts instance gets disposed out from under stale
    // chart/candleSeries refs held elsewhere (chart-studio-panel.tsx).
    placeholderData: keepPreviousData,
  });
}
