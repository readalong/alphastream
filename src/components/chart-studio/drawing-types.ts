export type DrawingTool =
  | "cursor"
  | "trendline"
  | "channel"
  | "fibonacci"
  | "hline"
  | "rectangle"
  | "pitchfork"
  | "fibfan"
  | "fibtimezones"
  | "wyckoff";

export interface Point {
  time: string; // YYYY-MM-DD
  price: number;
}

export interface Trendline {
  id: string;
  type: "trendline";
  p1: Point;
  p2: Point;
  color?: string;
  label?: string;
}

export interface Channel {
  id: string;
  type: "channel";
  mainLine: [Point, Point];
  parallelLine: [Point, Point];
  color?: string;
}

export interface FibLevel {
  pct: number;
  price: number;
  label: string;
  color: string;
  isDashed?: boolean;
}

export interface FibRetracement {
  id: string;
  type: "fibonacci";
  p1: Point; // swing start
  p2: Point; // swing end
  levels: FibLevel[];
  isUptrend: boolean;
}

export interface ElliottWave {
  id: string;
  type: "elliott";
  points: Point[];
  labels: string[];
  isConfident: boolean;
}

export interface HLine {
  id: string;
  type: "hline";
  price: number;
  color?: string;
  label?: string;
  isDashed?: boolean;
}

export interface Rectangle {
  id: string;
  type: "rectangle";
  p1: Point; // one corner
  p2: Point; // opposite corner
  color?: string;
}

// ── New drawing types ──────────────────────────────────────────────────────────

export interface PriceZone {
  id: string;
  type: "pricezone";
  priceMin: number;
  priceMax: number;
  color: string;       // fill
  borderColor: string;
  label?: string;
}

export interface CandlePattern {
  id: string;
  type: "candlepattern";
  time: string;
  price: number;
  label: string;
  bullish: boolean;
}

export interface Pitchfork {
  id: string;
  type: "pitchfork";
  p0: Point;
  p1: Point;
  p2: Point;
  color?: string;
}

export interface FibFan {
  id: string;
  type: "fibfan";
  origin: Point;
  endpoint: Point;
  isUptrend: boolean;
  color?: string;
}

export interface FibTimeZones {
  id: string;
  type: "fibtimezones";
  originTime: string;
  barTimes: string[];
  color?: string;
}

export type WyckoffPhase =
  | "Accumulation"
  | "Distribution"
  | "Re-accumulation"
  | "Re-distribution"
  | "Markup"
  | "Markdown";

export interface WyckoffMarker {
  id: string;
  type: "wyckoff";
  p1: Point;
  p2: Point;
  phase: WyckoffPhase;
  color?: string;
}

// ── Indicator settings ─────────────────────────────────────────────────────────

export interface IndicatorSettings {
  sma20: boolean;
  sma50: boolean;
  sma150: boolean;
  sma200: boolean;
  volumeMA: boolean;
  bollingerBands: boolean;
  atrEnvelope: boolean;
  ichimoku: boolean;
  rsi: boolean;
  macd: boolean;
}

// ── Unions ─────────────────────────────────────────────────────────────────────

export type Drawing =
  | Trendline
  | Channel
  | FibRetracement
  | ElliottWave
  | HLine
  | Rectangle
  | PriceZone
  | CandlePattern
  | Pitchfork
  | FibFan
  | FibTimeZones
  | WyckoffMarker;

export type DrawingsAction =
  | { type: "ADD"; drawing: Drawing }
  | { type: "REMOVE"; id: string }
  | { type: "SELECT"; id: string | null }
  | { type: "CLEAR" };

export interface DrawingsState {
  drawings: Drawing[];
  selectedId: string | null;
}

export function drawingsReducer(
  state: DrawingsState,
  action: DrawingsAction
): DrawingsState {
  switch (action.type) {
    case "ADD":
      return { ...state, drawings: [...state.drawings, action.drawing] };
    case "REMOVE":
      return {
        ...state,
        drawings: state.drawings.filter((d) => d.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case "SELECT":
      return { ...state, selectedId: action.id };
    case "CLEAR":
      return { drawings: [], selectedId: null };
    default:
      return state;
  }
}
