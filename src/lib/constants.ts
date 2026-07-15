// Stage/category color is semantic (bull/bear/caution meaning), never
// decorative - a 10-hue rainbow collapsed to the same 3-4 tokens every
// other signal in the app uses. Values are CSS var() references (not
// resolved hex) so every consumer - most of which set inline
// style={{color: ...}} - stays theme-aware across light/dark for free.
export const STAGE_COLORS: Record<string, { color: string; label: string }> = {
  S: { color: "var(--long)", label: "SURE SHOT" },
  B: { color: "var(--long)", label: "BOUNCE" },
  A: { color: "var(--long)", label: "ACTION" },
  X: { color: "var(--caution)", label: "ANOMALY" },
  "0": { color: "var(--text-muted)", label: "TRANSITION" },
  "1": { color: "var(--text-muted)", label: "STAGE 1" },
  "1D": { color: "var(--text-faint)", label: "DORMANT" },
  "2": { color: "var(--long)", label: "STAGE 2" },
  "3": { color: "var(--caution)", label: "STAGE 3" },
  "4": { color: "var(--short)", label: "STAGE 4" },
};

export const SIGNAL_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  "Minervini Template Passed": {
    name: "Minervini Template",
    description: "All trend template criteria met — price, SMA, and RS aligned for breakout",
  },
  "RS Line at 52wk High": {
    name: "RS at 52-Week High",
    description: "Relative strength line at a new 52-week high — outperforming the market",
  },
  "Pocket Pivot": {
    name: "Pocket Pivot",
    description: "Volume exceeds max down-day volume — institutional buying footprint",
  },
  "SMA200 Bounce": {
    name: "SMA200 Bounce",
    description: "Price bouncing off 200-day moving average — key support holding",
  },
  "VCP Pinch": {
    name: "VCP (Volatility Contraction)",
    description: "Bollinger bandwidth contracted — coiled for potential breakout",
  },
  "Whale Footprints": {
    name: "Whale Footprints",
    description: "Volume > 2x average on up days — institutional accumulation",
  },
  "Wyckoff Spring": {
    name: "Wyckoff Spring",
    description: "Price undercuts then reclaims support — shakeout complete",
  },
  "Breakaway Gap": {
    name: "Breakaway Gap",
    description: "Gap up on high volume — strong momentum and institutional interest",
  },
  "Institutional Score": {
    name: "High Institutional Score",
    description: "High buy/sell ratio from institutional traders — smart money accumulating",
  },
  "Absorption Bars (20d)": {
    name: "Absorption Bars",
    description: "Multiple demand absorption bars in 20 sessions — supply being absorbed",
  },
  "Inside Day Cluster": {
    name: "Inside Day Cluster",
    description: "Multiple inside days in recent sessions — volatility contraction before move",
  },
  "Upthrust": {
    name: "Upthrust",
    description: "Failed new high, closed in lower 40% — bearish reversal signal",
  },
  "Sign of Weakness": {
    name: "Sign of Weakness",
    description: "Price breaks 20-day low on volume — distribution or breakdown underway",
  },
  "Supply Bars (20d)": {
    name: "Supply Bars",
    description: "Multiple supply bars in 20 sessions — selling pressure present",
  },
  "Churning": {
    name: "Churning",
    description: "High-volume no-progress near highs — potential distribution",
  },
  "RSI Overbought": {
    name: "RSI Overbought",
    description: "RSI above 70 — potential short-term pullback risk",
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
  pending: { color: "var(--text-muted)", icon: "Clock" },
  running: { color: "var(--info)", icon: "Loader2" },
  completed: { color: "var(--long)", icon: "CheckCircle" },
  failed: { color: "var(--short)", icon: "XCircle" },
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
