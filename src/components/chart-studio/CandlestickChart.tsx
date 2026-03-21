"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { OHLCVBar } from "@/lib/types";

export interface ChartHandle {
  chart: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
}

interface CandlestickChartProps {
  data: OHLCVBar[];
  onChartReady?: (handle: ChartHandle) => void;
}

const CandlestickChart = forwardRef<ChartHandle, CandlestickChartProps>(
  function CandlestickChart({ data, onChartReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    useImperativeHandle(ref, () => ({
      get chart() { return chartRef.current; },
      get candleSeries() { return candleSeriesRef.current; },
    }));

    // Create chart once on mount
    useEffect(() => {
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "rgba(148, 163, 184, 0.9)",
          fontSize: 11,
          fontFamily: "'Inter', 'ui-monospace', monospace",
        },
        grid: {
          vertLines: { color: "rgba(100, 116, 139, 0.15)" },
          horzLines: { color: "rgba(100, 116, 139, 0.15)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(100, 116, 139, 0.5)", labelBackgroundColor: "#334155" },
          horzLine: { color: "rgba(100, 116, 139, 0.5)", labelBackgroundColor: "#334155" },
        },
        rightPriceScale: { borderColor: "rgba(100, 116, 139, 0.3)" },
        timeScale: { borderColor: "rgba(100, 116, 139, 0.3)", timeVisible: true },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });

      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        borderVisible: false,
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volSeriesRef.current = volSeries;

      onChartReady?.({ chart, candleSeries });

      return () => {
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volSeriesRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update both series whenever data (period) changes
    useEffect(() => {
      if (!chartRef.current || !candleSeriesRef.current || !volSeriesRef.current || data.length === 0) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candleSeriesRef.current.setData(data as any);
      volSeriesRef.current.setData(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((b) => ({
          time: b.time,
          value: b.volume,
          color: b.close >= b.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
        })) as any
      );
      chartRef.current.timeScale().fitContent();
    }, [data]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

export default CandlestickChart;
