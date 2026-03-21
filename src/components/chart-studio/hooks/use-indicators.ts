"use client";

import { useEffect, useRef } from "react";
import {
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { OHLCVBar } from "@/lib/types";
import type { IndicatorSettings } from "../drawing-types";
import { sma } from "../indicators/sma";
import { volumeMA } from "../indicators/volume-ma";
import { bollingerBands } from "../indicators/bollinger";
import { atrEnvelope } from "../indicators/atr";
import { rsi } from "../indicators/rsi";
import { macd } from "../indicators/macd";
import { ichimoku } from "../indicators/ichimoku";

type AnySeries = ISeriesApi<"Line"> | ISeriesApi<"Histogram">;

function applyPaneLayout(
  chart: IChartApi,
  map: Map<string, AnySeries>,
  hasRsi: boolean,
  hasMACD: boolean
) {
  // Use series.priceScale() — chart.priceScale("rsi") throws in v5 because
  // custom priceScaleIds are placed in a separate pane (index != 0).
  let candleBottom = 0.18;
  let volumeTop = 0.82;

  if (hasRsi && hasMACD) {
    candleBottom = 0.55;
    volumeTop = 0.90;
    map.get("rsi")?.priceScale().applyOptions({ scaleMargins: { top: 0.45, bottom: 0.28 } });
    map.get("macd_line")?.priceScale().applyOptions({ scaleMargins: { top: 0.72, bottom: 0.10 } });
  } else if (hasRsi) {
    candleBottom = 0.35;
    volumeTop = 0.88;
    map.get("rsi")?.priceScale().applyOptions({ scaleMargins: { top: 0.65, bottom: 0.12 } });
  } else if (hasMACD) {
    candleBottom = 0.35;
    volumeTop = 0.88;
    map.get("macd_line")?.priceScale().applyOptions({ scaleMargins: { top: 0.65, bottom: 0.12 } });
  }

  chart.priceScale("right").applyOptions({
    scaleMargins: { top: 0.05, bottom: candleBottom },
  });
  chart.priceScale("volume").applyOptions({
    scaleMargins: { top: volumeTop, bottom: 0 },
    borderVisible: false,
  });
}

export function useIndicators(
  chart: IChartApi | null,
  candleSeries: ISeriesApi<"Candlestick"> | null,
  data: OHLCVBar[],
  settings: IndicatorSettings
): void {
  const seriesMap = useRef<Map<string, AnySeries>>(new Map());
  const prevSettings = useRef<IndicatorSettings | null>(null);

  useEffect(() => {
    if (!chart || !candleSeries || data.length === 0) return;

    const map = seriesMap.current;

    const toggle = (
      key: string,
      enabled: boolean,
      createFn: () => AnySeries,
      setDataFn: (s: AnySeries) => void
    ) => {
      if (enabled) {
        if (!map.has(key)) {
          const s = createFn();
          map.set(key, s);
          setDataFn(s);
        } else {
          setDataFn(map.get(key)!);
        }
      } else {
        if (map.has(key)) {
          chart.removeSeries(map.get(key)!);
          map.delete(key);
        }
      }
    };

    // SMA lines
    const smaConfigs = [
      { key: "sma20",  period: 20,  color: "#3b82f6", enabled: settings.sma20  },
      { key: "sma50",  period: 50,  color: "#f97316", enabled: settings.sma50  },
      { key: "sma150", period: 150, color: "#a855f7", enabled: settings.sma150 },
      { key: "sma200", period: 200, color: "#ef4444", enabled: settings.sma200 },
    ];

    for (const { key, period, color, enabled } of smaConfigs) {
      toggle(
        key, enabled,
        () => chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        }),
        (s) => (s as ISeriesApi<"Line">).setData(sma(data, period) as never)
      );
    }

    // Volume MA
    toggle(
      "volumeMA", settings.volumeMA,
      () => chart.addSeries(LineSeries, {
        color: "#94a3b8",
        lineWidth: 1,
        priceScaleId: "volume",
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      }),
      (s) => (s as ISeriesApi<"Line">).setData(volumeMA(data, 20) as never)
    );

    // Bollinger Bands (3 series)
    const bbData = settings.bollingerBands ? bollingerBands(data) : null;
    toggle(
      "bb_upper", settings.bollingerBands,
      () => chart.addSeries(LineSeries, {
        color: "#60a5fa", lineWidth: 1, lineStyle: 2,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => bbData && (s as ISeriesApi<"Line">).setData(bbData.map((d) => ({ time: d.time, value: d.upper })) as never)
    );
    toggle(
      "bb_mid", settings.bollingerBands,
      () => chart.addSeries(LineSeries, {
        color: "#60a5fa", lineWidth: 1,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => bbData && (s as ISeriesApi<"Line">).setData(bbData.map((d) => ({ time: d.time, value: d.mid })) as never)
    );
    toggle(
      "bb_lower", settings.bollingerBands,
      () => chart.addSeries(LineSeries, {
        color: "#60a5fa", lineWidth: 1, lineStyle: 2,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => bbData && (s as ISeriesApi<"Line">).setData(bbData.map((d) => ({ time: d.time, value: d.lower })) as never)
    );

    // ATR Envelope (2 series)
    const atrData = settings.atrEnvelope ? atrEnvelope(data) : null;
    toggle(
      "atr_upper", settings.atrEnvelope,
      () => chart.addSeries(LineSeries, {
        color: "#f59e0b", lineWidth: 1, lineStyle: 2,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => atrData && (s as ISeriesApi<"Line">).setData(atrData.map((d) => ({ time: d.time, value: d.upper })) as never)
    );
    toggle(
      "atr_lower", settings.atrEnvelope,
      () => chart.addSeries(LineSeries, {
        color: "#f59e0b", lineWidth: 1, lineStyle: 2,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => atrData && (s as ISeriesApi<"Line">).setData(atrData.map((d) => ({ time: d.time, value: d.lower })) as never)
    );

    // Ichimoku (5 series)
    const ichiData = settings.ichimoku ? ichimoku(data) : null;
    const ichiConfigs = [
      { key: "ichi_tenkan",  color: "#06b6d4", field: "tenkan"  as const },
      { key: "ichi_kijun",   color: "#ef4444", field: "kijun"   as const },
      { key: "ichi_senkouA", color: "#22c55e", field: "senkouA" as const },
      { key: "ichi_senkouB", color: "#f87171", field: "senkouB" as const },
      { key: "ichi_chikou",  color: "#a855f7", field: "chikou"  as const },
    ];
    for (const { key, color, field } of ichiConfigs) {
      toggle(
        key, settings.ichimoku,
        () => chart.addSeries(LineSeries, {
          color, lineWidth: 1,
          lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
        }),
        (s) => {
          if (!ichiData) return;
          const pts = ichiData
            .filter((d) => d[field] !== undefined)
            .map((d) => ({ time: d.time, value: d[field]! }));
          (s as ISeriesApi<"Line">).setData(pts as never);
        }
      );
    }

    // RSI — price lines created ONCE in createFn, NOT in setDataFn (else they'd accumulate)
    toggle(
      "rsi", settings.rsi,
      () => {
        const s = chart.addSeries(LineSeries, {
          color: "#a855f7",
          lineWidth: 1,
          priceScaleId: "rsi",
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        s.createPriceLine({ price: 70, color: "#ef4444", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
        s.createPriceLine({ price: 30, color: "#22c55e", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
        return s;
      },
      (s) => {
        const rsiData = rsi(data);
        (s as ISeriesApi<"Line">).setData(rsiData as never);
      }
    );

    // MACD (3 series)
    const macdData = settings.macd ? macd(data) : null;
    toggle(
      "macd_line", settings.macd,
      () => chart.addSeries(LineSeries, {
        color: "#3b82f6", lineWidth: 1,
        priceScaleId: "macd",
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => macdData && (s as ISeriesApi<"Line">).setData(macdData.map((d) => ({ time: d.time, value: d.macd })) as never)
    );
    toggle(
      "macd_signal", settings.macd,
      () => chart.addSeries(LineSeries, {
        color: "#f97316", lineWidth: 1,
        priceScaleId: "macd",
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      }),
      (s) => macdData && (s as ISeriesApi<"Line">).setData(macdData.map((d) => ({ time: d.time, value: d.signal })) as never)
    );
    toggle(
      "macd_hist", settings.macd,
      () => chart.addSeries(HistogramSeries, {
        priceScaleId: "macd",
        lastValueVisible: false,
        priceLineVisible: false,
      }),
      (s) => macdData && (s as ISeriesApi<"Histogram">).setData(
        macdData.map((d) => ({
          time: d.time,
          value: d.hist,
          color: d.hist >= 0 ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)",
        })) as never
      )
    );

    // Adjust pane layout (pass map so we can use series.priceScale())
    applyPaneLayout(chart, map, settings.rsi, settings.macd);

    prevSettings.current = { ...settings };
  }, [chart, candleSeries, data, settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // series are removed when chart itself is destroyed
      seriesMap.current.clear();
    };
  }, []);
}
