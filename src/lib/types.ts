export interface ScreenerResult {
  ticker: string;
  close_price: number;
  category: string;
  stage: string;
  signals: string;
  sector?: string;
  industry?: string;
  sector_etf?: string;
}

export interface ChartResponse {
  ticker: string;
  chart_base64: string;
  screener: ScreenerResult;
  business_summary?: string;
  generated_at: string;
}

export interface AnalysisResponse {
  ticker: string;
  chart_base64: string;
  screener: ScreenerResult;
  ai_analysis: AiAnalysis | null;
  generated_at: string;
}

export interface AiAnalysis {
  visual_audit?: {
    trend_structure?: string;
    key_levels?: string;
    obv_analysis?: string;
    cci_analysis?: string;
  };
  decision?: {
    verdict?: string;
    confidence_score?: number;
    weighted_rationale?: string;
  };
  reasoning?: string;
  ticker?: string;
  screener_stage?: string;
  screener_signals?: string;
  sector?: string;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface JobResponse {
  job_id: string;
  status: string;
  job_type: string;
  created_at: string;
  message?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  job_type: string;
  created_at: string;
  completed_at?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface SessionInfo {
  session_id: string;
  created_at: string;
  has_screener_output: boolean;
  has_index_data: boolean;
  has_ai_analysis: boolean;
  chart_count: number;
}

export interface BatchScreenResponse {
  results: ScreenerResult[];
  count: number;
}

// --- Sector/Industry Types ---

export interface SectorInfo {
  sector_etf: string;
  sector_names: string[];
  ticker_count: number;
}

export interface IndustryInfo {
  industry: string;
  sector_etf: string;
  ticker_count: number;
}

export interface SectorRunInfo {
  filter_name: string;
  has_screen: boolean;
  has_charts: boolean;
  screen_files: string[];
  chart_count: number;
}

// --- Uptrend / Resistance Types ---

export interface ResistanceLevel {
  price: number;
  zone_low: number;
  zone_high: number;
  strength: number;
  source: string;
  pct_above: number;
}

export interface ResistanceResponse {
  ticker: string;
  current_price: number;
  levels: ResistanceLevel[];
  generated_at: string;
}

export interface ReportResistanceLevel {
  label: string;
  price: number;
  pct_above: number;
  strength: number;
  zone: string;
}

export interface UptrendStock {
  ticker: string;
  close_price: number;
  sector: string;
  industry: string;
  sector_etf: string;
  category: string;
  stage: string;
  signals: string;
  has_resistance: boolean;
  chart_file: string;
  levels: ReportResistanceLevel[];
}

export interface UptrendSummary {
  total_stocks: number;
  with_resistance: number;
  at_ath_no_resistance: number;
}

export interface UptrendReport {
  generated_at: string;
  session: string;
  filter: string | null;
  summary: UptrendSummary;
  stocks: UptrendStock[];
}

// --- Global Markets Types ---

export interface GlobalIndexScreening {
  stage: string | null;
  category: string | null;
  close_price: number | null;
  pct_chg_1d: number | null;
  pct_chg_5d: number | null;
  pct_chg_20d: number | null;
  sma50_position: "Above" | "Below" | "N/A";
  sma200_position: "Above" | "Below" | "N/A";
  rsi_14: number | null;
}

export interface GlobalIndexAI {
  trend_analysis?: {
    current_stage: string;
    trend_strength: string;
    sma_alignment: string;
    momentum: string;
    cci_signal?: string;
  };
  market_signal?: {
    bias: "BULLISH" | "NEUTRAL" | "BEARISH";
    confidence: number;
    risk_environment: string;
  };
  implications?: {
    stock_selection: string;
    sector_rotation: string;
    key_levels: string;
  };
  summary?: string;
}

export interface GlobalIndexEntry {
  name: string;
  ticker: string;
  country: string;
  region: "Asia Pacific" | "Europe";
  currency: string;
  screening: GlobalIndexScreening;
  ai_analysis: GlobalIndexAI;
}

export interface GlobalSynthesis {
  overall_regime?: string;
  regional_leaders?: string[];
  regional_laggards?: string[];
  risk_appetite?: string;
  strongest_index?: string;
  weakest_index?: string;
  asia_pacific_assessment?: string;
  europe_assessment?: string;
  us_implication?: string;
  executive_summary?: string;
}

export interface GlobalMarketReport {
  _session_id?: string;
  generated_at?: string;
  session?: string;
  indexes?: Record<string, GlobalIndexEntry>;
  global_synthesis?: GlobalSynthesis;
}

// --- News Types ---

// Tiingo-backed US/Global feed (overview page)
export interface NewsArticle {
  id: number | null;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  tags: string[];
  tickers: string[];
}

export interface NewsFeedResponse {
  count: number;
  cached: boolean;
  articles: NewsArticle[];
}

// yfinance + trafilatura ticker news (ticker & markets pages)
export interface TickerNewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string; // ISO 8601 or empty string
  tickers: string[];
  full_text: string;    // extracted body; empty if paywalled/blocked
}

export interface TickerNewsResponse {
  ticker: string;
  count: number;
  cached: boolean;
  articles: TickerNewsArticle[];
}

// --- Economic Data Types ---

export interface EconomicCalendarRelease {
  release_id: number;
  release_name: string;
  category: string;
}

export interface EconomicCalendarResponse {
  week: string;
  week_start: string;
  week_end: string;
  cached: boolean;
  by_date: Record<string, EconomicCalendarRelease[]>;
}

export interface EconomicObservation {
  series_id: string;
  series_name: string;
  unit: string;
  latest_value: number;
  latest_date: string;
  previous_value: number | null;
  previous_date: string | null;
  change: number | null;
  change_pct: number | null;
  direction: "up" | "down" | "flat" | null;
  signal: "bullish" | "bearish" | "neutral" | null;
  commentary: string | null;
}

export interface EconomicRelease {
  release_id: number;
  release_name: string;
  category: string;
  current_week_dates: string[];
  previous_week_dates: string[];
  observation: EconomicObservation | null;
}

export interface EconomicDataResponse {
  generated_at: string;
  cached: boolean;
  current_week: {
    week: string;
    week_start: string;
    week_end: string;
  };
  previous_week: {
    week: string;
    week_start: string;
    week_end: string;
  };
  releases: EconomicRelease[];
}

export interface VixAnalysis {
  current_level: number;
  daily_change_pct: number;
  trend_direction: "Falling" | "Rising" | "Stable";
  fear_level: "Low" | "Elevated" | "High" | "Extreme";
  regime_signal: "Risk-On" | "Neutral" | "Risk-Off" | "Crisis";
  commentary: string;
  implications: {
    position_sizing: "Full" | "Reduced" | "Minimal";
    hedging_urgency: "None" | "Consider" | "Urgent";
    opportunity_type: string;
  };
}

// --- Market Report (session report, JSON format) ---

export interface InstrumentAI {
  trend_analysis?: {
    current_stage: string;
    trend_strength: string;
    sma_alignment: string;
    momentum: string;
    cci_signal?: string;
  };
  market_signal?: {
    bias: "BULLISH" | "NEUTRAL" | "BEARISH";
    confidence: number;
    risk_environment: string;
  };
  implications?: {
    stock_selection: string;
    sector_rotation: string;
    key_levels: string;
  };
  summary?: string;
}

export interface InstrumentEntry {
  ticker: string;
  name: string;
  asset_type: string;
  close_price: number | null;
  pct_chg_1d: number | null;
  pct_chg_5d: number | null;
  pct_chg_20d: number | null;
  sma50_position: string;
  sma200_position: string;
  rsi_14: number | null;
  stage: string;
  category: string;
  signals: string;
  ai_analysis: InstrumentAI;
}

export interface ChartEntry {
  ticker: string;
  name: string;
  chart_path: string;
}

export interface MarketReport {
  generated_at: string;
  session: string;
  executive_summary: string;
  market_regime: {
    phase: string;
    broad_market_stage: string;
    confidence: number;
  };
  sector_analysis: {
    leading_sectors: string[];
    lagging_sectors: string[];
    rotation_signal: string;
  };
  risk_assessment: {
    risk_appetite: string;
    crypto_signal: string;
    commodity_signal: string;
  };
  trading_guidance: {
    stance: string;
    position_sizing: string;
    sector_preference: string[];
    sector_avoid: string[];
  };
  vix_analysis?: VixAnalysis | null;
  instruments: InstrumentEntry[];
  charts_available: Record<string, ChartEntry[]>;
}
