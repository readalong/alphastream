"use client";

import { useParams, useRouter } from "next/navigation";
import { useReducer, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { useOHLCV } from "@/hooks/use-ohlcv";
import { ChartToolbar } from "@/components/chart-studio/ChartToolbar";
import { DrawingLayer } from "@/components/chart-studio/DrawingLayer";
import {
  drawingsReducer,
  type DrawingTool,
  type IndicatorSettings,
} from "@/components/chart-studio/drawing-types";
import type { OHLCVPeriod } from "@/lib/types";
import { autoFibonacci } from "@/components/chart-studio/algorithms/fibonacci";
import { autoTrendlines } from "@/components/chart-studio/algorithms/trendline";
import { autoChannel } from "@/components/chart-studio/algorithms/channel";
import { suggestWaves } from "@/components/chart-studio/algorithms/elliott-wave";
import { autoSRZones } from "@/components/chart-studio/algorithms/sr-zones";
import { autoGapZones } from "@/components/chart-studio/algorithms/gap-detection";
import { autoPivotPoints } from "@/components/chart-studio/algorithms/pivot-points";
import { autoCandlePatterns } from "@/components/chart-studio/algorithms/candle-patterns";
import { useIndicators } from "@/components/chart-studio/hooks/use-indicators";
import type { IChartApi, ISeriesApi } from "lightweight-charts";

const CandlestickChart = dynamic(
  () => import("@/components/chart-studio/CandlestickChart"),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-[var(--bg-card)]" /> }
);

const DEFAULT_INDICATORS: IndicatorSettings = {
  sma20: false, sma50: false, sma150: false, sma200: false,
  volumeMA: false, bollingerBands: false, atrEnvelope: false,
  ichimoku: false, rsi: false, macd: false,
};

export default function ChartStudioPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string).toUpperCase();

  const [period, setPeriod] = useState<OHLCVPeriod>("1y");
  const [activeTool, setActiveTool] = useState<DrawingTool>("cursor");
  const [elliottDisclaimer, setElliottDisclaimer] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>(DEFAULT_INDICATORS);

  const [drawingsState, dispatch] = useReducer(drawingsReducer, {
    drawings: [],
    selectedId: null,
  });

  const [chartHandle, setChartHandle] = useState<{
    chart: IChartApi | null;
    candleSeries: ISeriesApi<"Candlestick"> | null;
  }>({ chart: null, candleSeries: null });

  const { data, isLoading, error } = useOHLCV(symbol, period);

  const handleChartReady = useCallback(
    (handle: { chart: IChartApi | null; candleSeries: ISeriesApi<"Candlestick"> | null }) => {
      setChartHandle(handle);
    },
    []
  );

  const handleIndicatorChange = useCallback(
    (key: keyof IndicatorSettings, value: boolean) => {
      setIndicators((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Attach indicators to the chart
  useIndicators(chartHandle.chart, chartHandle.candleSeries, data?.data ?? [], indicators);

  // Auto-compute handlers
  const handleAutoFib = () => {
    if (!data?.data.length) return;
    try {
      dispatch({ type: "ADD", drawing: autoFibonacci(data.data) });
    } catch { /* ignore */ }
  };

  const handleAutoTrendlines = () => {
    if (!data?.data.length) return;
    autoTrendlines(data.data).forEach((l) => dispatch({ type: "ADD", drawing: l }));
  };

  const handleAutoChannel = () => {
    if (!data?.data.length) return;
    const ch = autoChannel(data.data);
    if (ch) dispatch({ type: "ADD", drawing: ch });
  };

  const handleAutoElliott = () => {
    if (!data?.data.length) return;
    const wave = suggestWaves(data.data);
    dispatch({ type: "ADD", drawing: wave });
    if (!wave.isConfident) setElliottDisclaimer(true);
  };

  const handleAutoSRZones = () => {
    if (!data?.data.length) return;
    autoSRZones(data.data).forEach((z) => dispatch({ type: "ADD", drawing: z }));
  };

  const handleAutoGapDetection = () => {
    if (!data?.data.length) return;
    autoGapZones(data.data).forEach((z) => dispatch({ type: "ADD", drawing: z }));
  };

  const handleAutoPivotPoints = () => {
    if (!data?.data.length) return;
    autoPivotPoints(data.data).forEach((l) => dispatch({ type: "ADD", drawing: l }));
  };

  const handleAutoCandlePatterns = () => {
    if (!data?.data.length) return;
    autoCandlePatterns(data.data).forEach((p) => dispatch({ type: "ADD", drawing: p }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Page header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-page)]">
        <button
          onClick={() => router.back()}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">{symbol}</h1>
        <span className="text-xs text-[var(--text-muted)]">Chart Studio</span>
        {data && (
          <span className="text-xs text-[var(--text-muted)] ml-auto">
            {data.bars} bars · {data.period}
          </span>
        )}
      </div>

      {/* Toolbar */}
      <ChartToolbar
        period={period}
        onPeriodChange={setPeriod}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onAutoFib={handleAutoFib}
        onAutoTrendlines={handleAutoTrendlines}
        onAutoChannel={handleAutoChannel}
        onAutoElliott={handleAutoElliott}
        onAutoSRZones={handleAutoSRZones}
        onAutoGapDetection={handleAutoGapDetection}
        onAutoPivotPoints={handleAutoPivotPoints}
        onAutoCandlePatterns={handleAutoCandlePatterns}
        onClearAll={() => {
          dispatch({ type: "CLEAR" });
          setElliottDisclaimer(false);
          setIndicators(DEFAULT_INDICATORS);
        }}
        indicators={indicators}
        onIndicatorChange={handleIndicatorChange}
        isLoading={isLoading}
      />

      {/* Elliott wave disclaimer */}
      {elliottDisclaimer && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Suggested Elliott Wave count — verify manually. Automated EW counting is heuristic; results may be unreliable in choppy markets.
          <button onClick={() => setElliottDisclaimer(false)} className="ml-auto hover:text-amber-300">✕</button>
        </div>
      )}

      {/* Chart area */}
      <div className="flex-1 relative bg-[var(--bg-card)] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
              <span className="text-sm text-[var(--text-muted)]">Loading {symbol}…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 text-center max-w-sm p-6">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Failed to load chart data</p>
              <p className="text-xs text-[var(--text-muted)]">
                {error instanceof Error ? error.message : "Could not fetch OHLCV data. The ticker may not be available."}
              </p>
              <Link href="/charts" className="text-xs text-[var(--accent)] hover:underline">
                ← Back to Chart Studio
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <CandlestickChart data={data.data} onChartReady={handleChartReady} />
            <DrawingLayer
              chart={chartHandle.chart}
              candleSeries={chartHandle.candleSeries}
              drawings={drawingsState.drawings}
              selectedId={drawingsState.selectedId}
              activeTool={activeTool}
              dispatch={dispatch}
              ohlcvData={data.data}
            />
          </>
        )}
      </div>

      {/* Status bar */}
      {activeTool !== "cursor" && (
        <div className="px-4 py-1.5 bg-[var(--bg-card)] border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          {activeTool === "trendline"    && "Click and drag to draw a trendline"}
          {activeTool === "channel"      && "Click and drag to draw a channel"}
          {activeTool === "fibonacci"    && "Click and drag from swing low to swing high (or vice versa)"}
          {activeTool === "hline"        && "Click to place a horizontal level line"}
          {activeTool === "rectangle"    && "Click and drag to draw a rectangle"}
          {activeTool === "pitchfork"    && "Click 3 points: median origin (P0), upper fork (P1), lower fork (P2)"}
          {activeTool === "fibfan"       && "Click and drag from origin to endpoint to draw fan lines"}
          {activeTool === "fibtimezones" && "Click and drag to set the Fibonacci interval origin"}
          {activeTool === "wyckoff"      && "Drag to draw a Wyckoff phase box · click box to cycle phase"}
          {" · "}
          <span>Press Delete to remove selected drawing</span>
        </div>
      )}
    </div>
  );
}
