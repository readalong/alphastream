export const STAGE_COLORS: Record<string, { color: string; label: string }> = {
  S: { color: "#fbbf24", label: "SURE SHOT" },
  B: { color: "#06b6d4", label: "BOUNCE" },
  A: { color: "#10b981", label: "ACTION" },
  X: { color: "#a855f7", label: "ANOMALY" },
  "0": { color: "#64748b", label: "TRANSITION" },
  "1": { color: "#3b82f6", label: "STAGE 1" },
  "1D": { color: "rgba(59,130,246,0.5)", label: "DORMANT" },
  "2": { color: "#22c55e", label: "STAGE 2" },
  "3": { color: "#f59e0b", label: "STAGE 3" },
  "4": { color: "#ef4444", label: "STAGE 4" },
};

export const SIGNAL_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  "Hidden Accumulation": {
    name: "Hidden Accumulation",
    description: "Flat price action with rising OBV — smart money is buying",
  },
  "Power Turn": {
    name: "Power Turn",
    description: "Price crosses above 50SMA with volume thrust",
  },
  "VCP Pinch": {
    name: "VCP (Volatility Contraction)",
    description: "Bollinger bandwidth at 10th percentile — coiled for breakout",
  },
  "Whale Footprints": {
    name: "Whale Footprints",
    description: "Volume > 2x average on up days — institutional buying",
  },
  "Wyckoff Spring": {
    name: "Wyckoff Spring",
    description: "Price undercuts then reclaims support — shakeout complete",
  },
};

export const UNIVERSE = {
  market: ["SPY", "QQQ"],
  sectors: ["XLK", "XLC", "XLY", "XLF", "XLV", "XLI", "XLP", "XLE", "XLRE", "XLB", "XLU"],
  crypto: ["BTC-USD", "ETH-USD"],
  commodities: ["GLD", "SLV", "PPLT", "PALL", "CPER"],
};

export const BREADLINE_TICKERS = ["SPY", "QQQ", "DIA", "IWM", "BTC-USD", "ETH-USD", "GLD"];

export const CATEGORY_FILTERS = ["All", "S", "A", "B", "X", "0", "1", "1D", "2", "3", "4"];

export const JOB_STATUS_COLORS: Record<string, { color: string; icon: string }> = {
  pending: { color: "#64748b", icon: "Clock" },
  running: { color: "#3b82f6", icon: "Loader2" },
  completed: { color: "#22c55e", icon: "CheckCircle" },
  failed: { color: "#ef4444", icon: "XCircle" },
};

export const SECTOR_ETF_NAMES: Record<string, string> = {
  XLK: "Technology",
  XLC: "Communication Services",
  XLY: "Consumer Discretionary",
  XLF: "Financials",
  XLV: "Health Care",
  XLI: "Industrials",
  XLP: "Consumer Staples",
  XLE: "Energy",
  XLRE: "Real Estate",
  XLB: "Materials",
  XLU: "Utilities",
};

export const RESISTANCE_COLORS = {
  zone: "rgba(239, 68, 68, 0.15)",
  zoneBorder: "#ef4444",
  ath: "#22c55e",
  athBg: "rgba(34, 197, 94, 0.12)",
};
