"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import type {
  Drawing,
  DrawingTool,
  DrawingsAction,
  Trendline,
  Channel,
  FibRetracement,
  HLine,
  ElliottWave,
  Rectangle,
  PriceZone,
  CandlePattern,
  Pitchfork,
  FibFan,
  FibTimeZones,
  WyckoffMarker,
  WyckoffPhase,
  Point,
} from "./drawing-types";

interface DrawingLayerProps {
  chart: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
  drawings: Drawing[];
  selectedId: string | null;
  activeTool: DrawingTool;
  dispatch: React.Dispatch<DrawingsAction>;
  ohlcvData?: Array<{ time: string }>;
}

interface ScreenPoint {
  x: number;
  y: number;
}

function timeToX(chart: IChartApi, time: string): number | null {
  return chart.timeScale().timeToCoordinate(time as Time);
}

function priceToY(series: ISeriesApi<"Candlestick">, price: number): number | null {
  return series.priceToCoordinate(price);
}

const WYCKOFF_PHASES: WyckoffPhase[] = [
  "Accumulation",
  "Distribution",
  "Re-accumulation",
  "Re-distribution",
  "Markup",
  "Markdown",
];

const WYCKOFF_COLORS: Record<WyckoffPhase, string> = {
  Accumulation: "#22c55e",
  Distribution: "#ef4444",
  "Re-accumulation": "#a855f7",
  "Re-distribution": "#f97316",
  Markup: "#3b82f6",
  Markdown: "#ef4444",
};

export function DrawingLayer({
  chart,
  candleSeries,
  drawings,
  selectedId,
  activeTool,
  dispatch,
  ohlcvData,
}: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<{ start: ScreenPoint; startData: Point } | null>(null);
  const previewRef = useRef<SVGElement | null>(null);

  // Multi-click state for pitchfork (needs 3 clicks)
  const [pendingClicks, setPendingClicks] = useState<Point[]>([]);

  const [, setCoordVersion] = useState(0);
  useEffect(() => {
    if (!chart) return;
    const bump = () => setCoordVersion((v) => v + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(bump);
    chart.timeScale().subscribeVisibleLogicalRangeChange(bump);
    bump();
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(bump);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(bump);
    };
  }, [chart]);

  // Reset pending clicks when tool changes
  useEffect(() => {
    if (activeTool !== "pitchfork") {
      setPendingClicks([]);
    }
  }, [activeTool]);

  const screenToData = useCallback(
    (x: number, y: number): Point | null => {
      if (!chart || !candleSeries) return null;
      const time = chart.timeScale().coordinateToTime(x);
      const price = candleSeries.coordinateToPrice(y);
      if (!time || price === null) return null;
      return { time: time as string, price };
    },
    [chart, candleSeries]
  );

  // Build FibTimeZone bar times from origin using Fibonacci numbers
  const buildFibTimes = useCallback(
    (originTime: string): string[] => {
      if (!ohlcvData) return [];
      const originIdx = ohlcvData.findIndex((b) => b.time >= originTime);
      if (originIdx < 0) return [];
      const fibNums = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      return fibNums
        .map((n) => ohlcvData[originIdx + n]?.time)
        .filter(Boolean) as string[];
    },
    [ohlcvData]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (activeTool === "cursor" || activeTool === "pitchfork" || !chart || !candleSeries) return;
      const rect = svgRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dataPoint = screenToData(x, y);
      if (!dataPoint) return;
      drawingRef.current = { start: { x, y }, startData: dataPoint };
    },
    [activeTool, chart, candleSeries, screenToData]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!drawingRef.current || activeTool === "cursor" || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeTool === "rectangle" || activeTool === "wyckoff") {
        if (previewRef.current && previewRef.current.tagName === "line") {
          previewRef.current.remove();
          previewRef.current = null;
        }
        if (!previewRef.current) {
          const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rectEl.setAttribute("stroke", "rgba(99,102,241,0.8)");
          rectEl.setAttribute("stroke-width", "1.5");
          rectEl.setAttribute("stroke-dasharray", "4 2");
          rectEl.setAttribute("fill", "rgba(99,102,241,0.1)");
          rectEl.setAttribute("pointer-events", "none");
          svgRef.current.appendChild(rectEl);
          previewRef.current = rectEl;
        }
        const sx = drawingRef.current.start.x;
        const sy = drawingRef.current.start.y;
        previewRef.current.setAttribute("x", String(Math.min(sx, x)));
        previewRef.current.setAttribute("y", String(Math.min(sy, y)));
        previewRef.current.setAttribute("width", String(Math.abs(x - sx)));
        previewRef.current.setAttribute("height", String(Math.abs(y - sy)));
      } else {
        if (previewRef.current && previewRef.current.tagName === "rect") {
          previewRef.current.remove();
          previewRef.current = null;
        }
        if (!previewRef.current) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("stroke", "rgba(99,102,241,0.8)");
          line.setAttribute("stroke-width", "1.5");
          line.setAttribute("stroke-dasharray", "4 2");
          line.setAttribute("pointer-events", "none");
          svgRef.current.appendChild(line);
          previewRef.current = line;
        }
        previewRef.current.setAttribute("x1", String(drawingRef.current.start.x));
        previewRef.current.setAttribute("y1", String(drawingRef.current.start.y));
        previewRef.current.setAttribute("x2", String(x));
        previewRef.current.setAttribute("y2", String(y));
      }
    },
    [activeTool]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!drawingRef.current || activeTool === "cursor" || activeTool === "pitchfork") return;

      if (previewRef.current) {
        previewRef.current.remove();
        previewRef.current = null;
      }

      const rect = svgRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const endData = screenToData(x, y);
      if (!endData) {
        drawingRef.current = null;
        return;
      }

      const p1 = drawingRef.current.startData;
      const p2 = endData;
      drawingRef.current = null;

      if (activeTool === "trendline") {
        dispatch({
          type: "ADD",
          drawing: {
            id: `tl-manual-${Date.now()}`,
            type: "trendline",
            p1,
            p2,
            color: "var(--accent)",
          } satisfies Trendline,
        });
      } else if (activeTool === "fibonacci") {
        const isUptrend = p2.price > p1.price;
        const low = isUptrend ? p1.price : p2.price;
        const high = isUptrend ? p2.price : p1.price;
        const range = high - low;
        const fibDefs = [
          { pct: 0,     label: "0%",              color: "#ef4444" },
          { pct: 0.236, label: "23.6%",           color: "#f97316" },
          { pct: 0.382, label: "38.2%",           color: "#eab308" },
          { pct: 0.5,   label: "50%",             color: "#64748b" },
          { pct: 0.618, label: "61.8% \u2014 Golden", color: "#6366f1" },
          { pct: 0.786, label: "78.6%",           color: "#8b5cf6" },
          { pct: 1,     label: "100%",            color: "#ef4444" },
          { pct: 1.272, label: "127.2% Ext",      color: "#22c55e", isDashed: true },
          { pct: 1.382, label: "138.2% Ext",      color: "#22c55e", isDashed: true },
          { pct: 1.618, label: "161.8% Ext",      color: "#22c55e", isDashed: true },
        ];
        dispatch({
          type: "ADD",
          drawing: {
            id: `fib-manual-${Date.now()}`,
            type: "fibonacci",
            p1,
            p2,
            isUptrend,
            levels: fibDefs.map(({ pct, label, color, isDashed }) => {
              const price = isUptrend
                ? pct <= 1 ? high - range * pct : high + range * (pct - 1)
                : pct <= 1 ? low + range * pct  : low - range * (pct - 1);
              return { pct, price, label, color, isDashed: isDashed ?? false };
            }),
          } satisfies FibRetracement,
        });
      } else if (activeTool === "channel") {
        const offset = Math.abs(p2.price - p1.price) * 0.5;
        dispatch({
          type: "ADD",
          drawing: {
            id: `ch-manual-${Date.now()}`,
            type: "channel",
            mainLine: [p1, p2],
            parallelLine: [
              { time: p1.time, price: p1.price + offset },
              { time: p2.time, price: p2.price + offset },
            ],
            color: "#6366f1",
          } satisfies Channel,
        });
      } else if (activeTool === "hline") {
        dispatch({
          type: "ADD",
          drawing: {
            id: `hl-manual-${Date.now()}`,
            type: "hline",
            price: p1.price,
            color: "#6366f1",
          } satisfies HLine,
        });
      } else if (activeTool === "rectangle") {
        dispatch({
          type: "ADD",
          drawing: {
            id: `rect-manual-${Date.now()}`,
            type: "rectangle",
            p1,
            p2,
            color: "#6366f1",
          } satisfies Rectangle,
        });
      } else if (activeTool === "fibfan") {
        const isUptrend = p2.price > p1.price;
        dispatch({
          type: "ADD",
          drawing: {
            id: `fibfan-manual-${Date.now()}`,
            type: "fibfan",
            origin: p1,
            endpoint: p2,
            isUptrend,
            color: "#6366f1",
          } satisfies FibFan,
        });
      } else if (activeTool === "fibtimezones") {
        const barTimes = buildFibTimes(p1.time);
        dispatch({
          type: "ADD",
          drawing: {
            id: `fibtz-manual-${Date.now()}`,
            type: "fibtimezones",
            originTime: p1.time,
            barTimes,
            color: "#6366f1",
          } satisfies FibTimeZones,
        });
      } else if (activeTool === "wyckoff") {
        dispatch({
          type: "ADD",
          drawing: {
            id: `wyckoff-manual-${Date.now()}`,
            type: "wyckoff",
            p1,
            p2,
            phase: "Accumulation",
            color: "#22c55e",
          } satisfies WyckoffMarker,
        });
      }
    },
    [activeTool, dispatch, screenToData, buildFibTimes]
  );

  // Handle click for pitchfork (3-click tool)
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (activeTool === "cursor") {
        dispatch({ type: "SELECT", id: null });
        return;
      }
      if (activeTool !== "pitchfork" || !chart || !candleSeries) return;

      const rect = svgRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dataPoint = screenToData(x, y);
      if (!dataPoint) return;

      // Use direct state value (not functional update) so dispatch can be called safely
      const next = [...pendingClicks, dataPoint];
      if (next.length === 3) {
        dispatch({
          type: "ADD",
          drawing: {
            id: `pitchfork-manual-${Date.now()}`,
            type: "pitchfork",
            p0: next[0],
            p1: next[1],
            p2: next[2],
            color: "#6366f1",
          } satisfies Pitchfork,
        });
        setPendingClicks([]);
      } else {
        setPendingClicks(next);
      }
    },
    [activeTool, chart, candleSeries, screenToData, dispatch, pendingClicks]
  );

  // Cycle Wyckoff phase on click
  const cycleWyckoffPhase = useCallback(
    (id: string, currentPhase: WyckoffPhase) => {
      const idx = WYCKOFF_PHASES.indexOf(currentPhase);
      const nextPhase = WYCKOFF_PHASES[(idx + 1) % WYCKOFF_PHASES.length];
      // Remove old + add updated (simple approach)
      const drawing = drawings.find((d) => d.id === id) as WyckoffMarker | undefined;
      if (!drawing) return;
      dispatch({ type: "REMOVE", id });
      dispatch({
        type: "ADD",
        drawing: { ...drawing, phase: nextPhase, color: WYCKOFF_COLORS[nextPhase] },
      });
    },
    [drawings, dispatch]
  );

  // Delete selected on Delete key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        dispatch({ type: "REMOVE", id: selectedId });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, dispatch]);

  const renderDrawings = () => {
    if (!chart || !candleSeries || !svgRef.current) return null;
    const svgWidth = svgRef.current.clientWidth;
    const svgHeight = svgRef.current.clientHeight;

    return drawings.map((d) => {
      const isSelected = d.id === selectedId;
      // pointer-events: auto ensures drawings are clickable even when the SVG
      // parent has pointer-events: none (cursor mode passthrough for chart pan/zoom)
      const selectProps = {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          dispatch({ type: "SELECT", id: isSelected ? null : d.id });
        },
        style: { cursor: "pointer", pointerEvents: "auto" as const },
      };

      if (d.type === "trendline") {
        const x1 = timeToX(chart, d.p1.time);
        const y1 = priceToY(candleSeries, d.p1.price);
        const x2 = timeToX(chart, d.p2.time);
        const y2 = priceToY(candleSeries, d.p2.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        return (
          <g key={d.id} {...selectProps}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={d.color ?? "#6366f1"}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray={isSelected ? "6 2" : undefined}
            />
            {d.label && (
              <text x={x2 + 4} y={y2} fill={d.color ?? "#6366f1"} fontSize={10} dominantBaseline="middle">
                {d.label}
              </text>
            )}
          </g>
        );
      }

      if (d.type === "channel") {
        const [ml1, ml2] = d.mainLine;
        const [pl1, pl2] = d.parallelLine;
        const mx1 = timeToX(chart, ml1.time);
        const my1 = priceToY(candleSeries, ml1.price);
        const mx2 = timeToX(chart, ml2.time);
        const my2 = priceToY(candleSeries, ml2.price);
        const px1 = timeToX(chart, pl1.time);
        const py1 = priceToY(candleSeries, pl1.price);
        const px2 = timeToX(chart, pl2.time);
        const py2 = priceToY(candleSeries, pl2.price);
        if (mx1 === null || my1 === null || mx2 === null || my2 === null ||
            px1 === null || py1 === null || px2 === null || py2 === null) return null;
        return (
          <g key={d.id} {...selectProps} stroke={d.color ?? "#6366f1"} strokeWidth={isSelected ? 2 : 1.5} fill="none">
            <line x1={mx1} y1={my1} x2={mx2} y2={my2} strokeDasharray={isSelected ? "6 2" : undefined} />
            <line x1={px1} y1={py1} x2={px2} y2={py2} strokeDasharray={isSelected ? "6 2" : undefined} />
            <polygon
              points={`${mx1},${my1} ${mx2},${my2} ${px2},${py2} ${px1},${py1}`}
              fill={`${d.color ?? "#6366f1"}18`}
              stroke="none"
            />
          </g>
        );
      }

      if (d.type === "fibonacci") {
        return (
          <g key={d.id} {...selectProps}>
            {d.levels.map((lv) => {
              const y = priceToY(candleSeries, lv.price);
              if (y === null) return null;
              return (
                <g key={lv.label}>
                  <line
                    x1={0} y1={y} x2={svgWidth} y2={y}
                    stroke={lv.color}
                    strokeWidth={1}
                    opacity={0.7}
                    strokeDasharray={lv.isDashed ? "3 3" : undefined}
                  />
                  <text x={4} y={y - 2} fill={lv.color} fontSize={9}>
                    {lv.label} — {lv.price.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      if (d.type === "hline") {
        const y = priceToY(candleSeries, d.price);
        if (y === null) return null;
        return (
          <g key={d.id} {...selectProps}>
            <line
              x1={0} y1={y} x2={svgWidth} y2={y}
              stroke={d.color ?? "#6366f1"}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={d.isDashed ? "4 2" : "4 2"}
            />
            {d.label && (
              <text x={4} y={y - 3} fill={d.color ?? "#6366f1"} fontSize={10}>{d.label}</text>
            )}
          </g>
        );
      }

      if (d.type === "elliott") {
        const wave = d as ElliottWave;
        return (
          <g key={d.id} {...selectProps}>
            {wave.points.map((pt, i) => {
              const x = timeToX(chart, pt.time);
              const y = priceToY(candleSeries, pt.price);
              if (x === null || y === null) return null;
              const nextPt = wave.points[i + 1];
              const nx = nextPt ? timeToX(chart, nextPt.time) : null;
              const ny = nextPt ? priceToY(candleSeries, nextPt.price) : null;
              return (
                <g key={i}>
                  {nx !== null && ny !== null && (
                    <line x1={x} y1={y} x2={nx} y2={ny} stroke="#3b82f6" strokeWidth={1.5} />
                  )}
                  <circle cx={x} cy={y} r={4} fill="#3b82f6" />
                  {wave.labels[i] && (
                    <text x={x + 5} y={y - 5} fill="#93c5fd" fontSize={10} fontWeight="bold">
                      {wave.labels[i]}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      }

      if (d.type === "rectangle") {
        const x1 = timeToX(chart, d.p1.time);
        const y1 = priceToY(candleSeries, d.p1.price);
        const x2 = timeToX(chart, d.p2.time);
        const y2 = priceToY(candleSeries, d.p2.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);
        return (
          <g key={d.id} {...selectProps}>
            <rect
              x={rx} y={ry} width={rw} height={rh}
              stroke={d.color ?? "#6366f1"}
              strokeWidth={isSelected ? 2 : 1.5}
              fill={`${d.color ?? "#6366f1"}18`}
              strokeDasharray={isSelected ? "6 2" : undefined}
            />
          </g>
        );
      }

      // ── New drawing types ────────────────────────────────────────────────────

      if (d.type === "pricezone") {
        const yMax = priceToY(candleSeries, d.priceMax);
        const yMin = priceToY(candleSeries, d.priceMin);
        if (yMax === null || yMin === null) return null;
        const zoneY = Math.min(yMax, yMin);
        const zoneH = Math.abs(yMin - yMax);
        return (
          <g key={d.id} {...selectProps}>
            <rect
              x={0} y={zoneY} width={svgWidth} height={zoneH}
              fill={d.color}
              stroke="none"
            />
            <line x1={0} y1={zoneY} x2={svgWidth} y2={zoneY}
              stroke={d.borderColor} strokeWidth={1} opacity={0.6} />
            <line x1={0} y1={zoneY + zoneH} x2={svgWidth} y2={zoneY + zoneH}
              stroke={d.borderColor} strokeWidth={1} opacity={0.6} />
            {d.label && (
              <text
                x={svgWidth - 4} y={zoneY + 2}
                fill={d.borderColor} fontSize={9}
                textAnchor="end" dominantBaseline="hanging" opacity={0.8}
              >
                {d.label}
              </text>
            )}
          </g>
        );
      }

      if (d.type === "candlepattern") {
        const x = timeToX(chart, d.time);
        const y = priceToY(candleSeries, d.price);
        if (x === null || y === null) return null;
        const color = d.bullish ? "#22c55e" : "#ef4444";
        const symbol = d.bullish ? "▲" : "▼";
        return (
          <g key={d.id} {...selectProps}>
            <text x={x} y={y} fill={color} fontSize={9} textAnchor="middle" dominantBaseline="middle">
              {symbol}
            </text>
            <text x={x} y={d.bullish ? y + 10 : y - 10} fill={color} fontSize={8}
              textAnchor="middle" dominantBaseline="middle" opacity={0.85}>
              {d.label}
            </text>
          </g>
        );
      }

      if (d.type === "pitchfork") {
        const p0s = { x: timeToX(chart, d.p0.time), y: priceToY(candleSeries, d.p0.price) };
        const p1s = { x: timeToX(chart, d.p1.time), y: priceToY(candleSeries, d.p1.price) };
        const p2s = { x: timeToX(chart, d.p2.time), y: priceToY(candleSeries, d.p2.price) };
        if (p0s.x === null || p0s.y === null || p1s.x === null || p1s.y === null ||
            p2s.x === null || p2s.y === null) return null;

        const midX = (p1s.x + p2s.x) / 2;
        const midY = (p1s.y + p2s.y) / 2;
        const dxM = midX - p0s.x;
        const dyM = midY - p0s.y;
        const extend = svgWidth + 200;

        // Extend lines far right
        const extendLine = (startX: number, startY: number, dirX: number, dirY: number) => {
          if (dirX === 0) return { x: startX, y: startY };
          const t = (extend - startX) / dirX;
          return { x: extend, y: startY + t * dirY };
        };

        const medEnd = extendLine(p0s.x, p0s.y, dxM, dyM);
        const upperEnd = extendLine(p1s.x, p1s.y, dxM, dyM);
        const lowerEnd = extendLine(p2s.x, p2s.y, dxM, dyM);
        const color = d.color ?? "#6366f1";

        return (
          <g key={d.id} {...selectProps} stroke={color} strokeWidth={isSelected ? 2 : 1.5} fill="none" opacity={0.85}>
            {/* Median line */}
            <line x1={p0s.x} y1={p0s.y} x2={medEnd.x} y2={medEnd.y} />
            {/* Upper fork */}
            <line x1={p1s.x} y1={p1s.y} x2={upperEnd.x} y2={upperEnd.y} strokeDasharray="4 2" />
            {/* Lower fork */}
            <line x1={p2s.x} y1={p2s.y} x2={lowerEnd.x} y2={lowerEnd.y} strokeDasharray="4 2" />
            {/* Handle: p1 to p2 */}
            <line x1={p1s.x} y1={p1s.y} x2={p2s.x} y2={p2s.y} strokeDasharray="2 2" opacity={0.4} />
            {/* Anchor dots */}
            <circle cx={p0s.x} cy={p0s.y} r={3} fill={color} stroke="none" />
            <circle cx={p1s.x} cy={p1s.y} r={3} fill={color} stroke="none" />
            <circle cx={p2s.x} cy={p2s.y} r={3} fill={color} stroke="none" />
          </g>
        );
      }

      if (d.type === "fibfan") {
        const originS = { x: timeToX(chart, d.origin.time), y: priceToY(candleSeries, d.origin.price) };
        const endS = { x: timeToX(chart, d.endpoint.time), y: priceToY(candleSeries, d.endpoint.price) };
        if (originS.x === null || originS.y === null || endS.x === null || endS.y === null) return null;

        const pcts = [0.236, 0.382, 0.5, 0.618, 0.786];
        // range = endpoint - origin (positive = uptrend, negative = downtrend)
        const range = d.endpoint.price - d.origin.price;
        const color = d.color ?? "#6366f1";
        const extend = svgWidth + 200;
        const ox = originS.x!;
        const oy = originS.y!;
        const dx = endS.x! - ox;

        return (
          <g key={d.id} {...selectProps} stroke={color} strokeWidth={1} fill="none" opacity={0.75}>
            {pcts.map((pct) => {
              if (dx === 0) return null;
              // Fan line at pct fraction of the range at the endpoint x
              const targetPrice = d.origin.price + range * pct;
              const targetY = priceToY(candleSeries, targetPrice);
              if (targetY === null) return null;
              const slope = (targetY - oy) / dx;
              const extY = oy + slope * (extend - ox);
              return (
                <g key={pct}>
                  <line
                    x1={ox} y1={oy}
                    x2={extend} y2={extY}
                    strokeDasharray="3 2"
                  />
                  <text x={extend - 2} y={extY - 2} fontSize={8} fill={color}
                    textAnchor="end" opacity={0.8}>
                    {(pct * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}
            <circle cx={originS.x!} cy={originS.y!} r={3} fill={color} stroke="none" />
          </g>
        );
      }

      if (d.type === "fibtimezones") {
        const color = d.color ?? "#6366f1";
        const fibNums = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        return (
          <g key={d.id} {...selectProps}>
            {d.barTimes.map((t, idx) => {
              const x = timeToX(chart, t);
              if (x === null) return null;
              return (
                <g key={t}>
                  <line
                    x1={x} y1={0} x2={x} y2={svgHeight}
                    stroke={color} strokeWidth={1} opacity={0.35}
                    strokeDasharray="3 2"
                  />
                  <text x={x + 2} y={12} fill={color} fontSize={8} opacity={0.65}>
                    {fibNums[idx]}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      if (d.type === "wyckoff") {
        const x1 = timeToX(chart, d.p1.time);
        const y1 = priceToY(candleSeries, d.p1.price);
        const x2 = timeToX(chart, d.p2.time);
        const y2 = priceToY(candleSeries, d.p2.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        const color = d.color ?? WYCKOFF_COLORS[d.phase];
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);
        const cx = rx + rw / 2;
        const cy = ry + rh / 2;

        return (
          <g
            key={d.id}
            onClick={(e) => {
              e.stopPropagation();
              if (activeTool === "cursor") {
                cycleWyckoffPhase(d.id, d.phase);
              } else {
                dispatch({ type: "SELECT", id: isSelected ? null : d.id });
              }
            }}
            style={{ cursor: "pointer", pointerEvents: "auto" as const }}
          >
            <rect
              x={rx} y={ry} width={rw} height={rh}
              fill={`${color}20`}
              stroke={color}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray={isSelected ? "6 2" : undefined}
            />
            <text
              x={cx} y={cy}
              fill={color} fontSize={10} fontWeight="600"
              textAnchor="middle" dominantBaseline="middle"
              opacity={0.9}
            >
              {d.phase}
            </text>
          </g>
        );
      }

      return null;
    });
  };

  // Render pitchfork pending click preview
  const renderPitchforkPreview = () => {
    if (activeTool !== "pitchfork" || pendingClicks.length === 0 || !chart || !candleSeries) return null;
    const color = "rgba(99,102,241,0.8)";
    return (
      <g>
        {pendingClicks.map((pt, i) => {
          const x = timeToX(chart, pt.time);
          const y = priceToY(candleSeries, pt.price);
          if (x === null || y === null) return null;
          return <circle key={i} cx={x} cy={y} r={4} fill={color} />;
        })}
        {pendingClicks.length >= 2 && (() => {
          const x1 = timeToX(chart, pendingClicks[0].time);
          const y1 = priceToY(candleSeries, pendingClicks[0].price);
          const x2 = timeToX(chart, pendingClicks[1].time);
          const y2 = priceToY(candleSeries, pendingClicks[1].price);
          if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray="4 2" />;
        })()}
      </g>
    );
  };

  const isDrawing = activeTool !== "cursor";

  // Strategy: the container div and SVG are always pointer-events:none so the
  // underlying chart can pan/zoom freely in cursor mode.
  // In drawing mode, a transparent <rect> is the FIRST child of the SVG — it sits
  // behind all drawings and captures mousedown/move/up/click for new-drawing input.
  // Individual drawing <g> elements always have pointer-events:auto so they are
  // clickable in BOTH cursor and drawing modes (SVG children can override parent none).
  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full overflow-visible"
        style={{
          cursor: isDrawing ? "crosshair" : "default",
          pointerEvents: "none",
        }}
      >
        {/* Drawing-mode hit target — rendered first (behind drawings) */}
        {isDrawing && (
          <rect
            x={0} y={0} width="100%" height="100%"
            fill="transparent"
            style={{ pointerEvents: "all", cursor: "crosshair" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
          />
        )}
        {renderDrawings()}
        {renderPitchforkPreview()}
      </svg>
    </div>
  );
}
