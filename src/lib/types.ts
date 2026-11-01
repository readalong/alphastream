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

// --- Recommendations Types ---

export type RegimeColor = "GREEN" | "YELLOW" | "RED";
export type ConvictionTier = "STRONG_BUY" | "BUY" | "SPECULATIVE";
export type ExitAction = "SELL" | "REDUCE" | "TIGHTEN" | "WARNING";
export type ExitUrgency = "IMMEDIATE" | "WATCH";
export type SectorTier = "LEADING" | "NEUTRAL" | "LAGGING";

export interface RegimeBreadth {
  pct_above_200sma: number;
  pct_above_50sma: number;
  advance_decline_ratio: number;
  new_20d_highs: number;
  new_20d_lows: number;
  highs_lows_ratio: number;
}

export interface RegimeIndexStatus {
  close: number;
  above_20d: boolean;
  above_50d: boolean;
  above_200d: boolean;
}

export interface RegimeResponse {
  regime: RegimeColor;
  previous_regime: string;
  regime_changed: boolean;
  transition_action: string | null;
  breadth: RegimeBreadth | null;
  index_status: Record<string, RegimeIndexStatus>;
  details: string;
}

export interface SectorRanking {
  rank: number;
  etf: string;
  name: string;
  composite_score: number;
  tier: SectorTier;
  pct_20d: number;
  pct_5d?: number;
  rsi: number;
  pct_above_50sma?: number;
  sma50_pct?: number;
  cmf: number;
  rotation_accel?: number;
  score_adjustment?: number;
  // Extended fields (may not be present on older responses)
  etf_above_200d?: boolean;
  etf_200d_extension_pct?: number;
  etf_vs_spy_20d_pct?: number;
  etf_vs_spy_rs?: number;
  summary?: string;
}

export interface SectorRankingsResponse {
  // API returns "sectors" array
  sectors: SectorRanking[];
  count?: number;
  // Legacy field name kept for compatibility
  rankings?: SectorRanking[];
  tier_breakdown?: { LEADING: string[]; NEUTRAL: string[]; LAGGING: string[] };
  generated_at?: string;
}

export interface PortfolioCapacity {
  regime: string;
  max_positions: number;
  max_per_sector: number;
  max_heat_pct: number;
  positions_remaining: number;
  heat_remaining_pct: number;
}

export interface PortfolioHealthResponse {
  total_positions: number;
  total_heat_pct: number;
  sector_breakdown: Record<string, number>;
  highest_concentration: string;
  days_since_regime_change: number;
  capacity: PortfolioCapacity;
}

export interface OpenPosition {
  ticker: string;
  sector: string;
  industry: string;
  sector_etf: string;
  entry_price: number;
  stop_loss: number;
  trailing_stop: number;
  atr_14: number;
  risk_pct: number;
  position_pct: number;
  shares: number;
  conviction_tier: string;
  trigger_type: string;
  wave_position: string;
  added_at: string;
  targets: Array<{ price: number; pct_gain: number; source: string }>;
}

export interface PositionsResponse {
  positions: OpenPosition[];
  count: number;
}

export interface FactorScore {
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  wave: number;
  total: number;
  sector_adjustment: number;
  adjusted_total: number;
  details: Record<string, number | string>;
}

export interface ConvictionDetail {
  tier: ConvictionTier | null;
  position_multiplier: number;
  rationale: string;
}

export interface RiskTarget {
  price: number;
  pct_gain: number;
  source: string;
}

export interface RiskParameters {
  stop_loss: number;
  trailing_stop: number;
  atr_14: number;
  risk_per_share: number;
  position_pct: number;
  position_value: number;
  shares: number;
  risk_reward_ratio: number;
  targets: RiskTarget[];
}

export interface EntryCheck {
  trigger_type: string;
  trigger_price: number;
  volume_confirmed: boolean;
  guard_warnings: string[];
  confirmation_days: number;
  breakout_level: number;
  level_significance: string;
  status?: string;
  confirmation_quality?: { volume_ratio: number; close_location: number };
}

export interface SectorContext {
  etf: string;
  etf_name: string;
  etf_rank: number;
  etf_tier: string;
  etf_above_200d: boolean;
  etf_200d_extension_pct: number;
  etf_vs_spy_20d_pct: number;
  etf_vs_spy_rs: number;
  summary: string;
}

export interface BuyRecommendation {
  ticker: string;
  action: "BUY";
  rank: number;
  conviction: ConvictionDetail;
  factor_score: FactorScore;
  entry: EntryCheck;
  risk: RiskParameters;
  screener_category: string;
  screener_stage: string;
  screener_signals: string;
  wave_position: string;
  wave_confidence: number;
  weekly_aligned: boolean;
  sector: string;
  industry: string;
  sector_rank: number;
  sector_tier: string;
  close_price: number;
  sector_context?: SectorContext;
}

export interface ExitSignal {
  ticker: string;
  action: ExitAction;
  reason: string;
  urgency: ExitUrgency;
  details: string;
  updated_stop: number | null;
}

export interface PendingBreakout {
  ticker: string;
  direction: "UP" | "DOWN";
  trigger_type: string;
  breakout_level: number;
  trigger_date: string;
  level_significance: "STANDARD" | "SIGNIFICANT" | "BYPASS";
  days_required: number;
  observation_window: number;
  closes_in_direction: number;
  closes_against: number;
  trading_days_elapsed: number;
  quality_score: number;
  daily_observations: Array<{
    date: string;
    close: number;
    in_direction: boolean;
    volume_ratio: number;
  }>;
}

export interface RecommendationSummary {
  candidates_screened: number;
  passed_liquidity: number;
  passed_weekly_gate: number;
  scored: number;
  buy_count: number;
  sell_count: number;
  pending_count: number;
  regime: string;
  sector_filter: string | null;
}

export interface DailyRecommendations {
  date: string;
  market_regime: RegimeResponse;
  sector_rankings: SectorRanking[];
  buy_recommendations: BuyRecommendation[];
  sell_signals: ExitSignal[];
  hold_positions: Array<{ ticker: string; status: string; note: string }>;
  pending_breakouts: PendingBreakout[];
  portfolio_health: Omit<PortfolioHealthResponse, "capacity">;
  summary: RecommendationSummary;
  generated_at: string;
}

export interface RecommendationHistoryEntry {
  date: string;       // "YYYYMMDD"
  date_iso: string;   // "YYYY-MM-DD"
  generated_at: string;
  regime: RegimeColor;
  buy_count: number;
  sell_count: number;
  pending_count: number;
  candidates_screened: number;
  summary?: RecommendationSummary;
}

export interface RecommendationHistoryResponse {
  days: RecommendationHistoryEntry[];
  has_more: boolean;
  next_cursor: string | null;
  total_available: number;
}

export interface AddPositionRequest {
  ticker: string;
  entry_price: number;
  stop_loss: number;
  trailing_stop: number;
  atr_14: number;
  risk_pct: number;
  position_pct: number;
  shares: number;
  conviction_tier: string;
  trigger_type: string;
  wave_position: string;
  sector: string;
  industry: string;
  sector_etf: string;
  targets: Array<{ price: number; pct_gain: number; source: string }>;
}

export interface PositionMutationResponse {
  status: "added" | "closed";
  ticker: string;
  total_positions: number;
  total_heat_pct: number;
}

export interface RunRecommendResponse {
  status: string;
  date: string;
  buy_count: number;
  sell_count: number;
  pending_count: number;
  candidates_screened: number;
  regime: string;
  generated_at: string;
}

// --- Earnings Types ---

export type EarningsSignal =
  | "EPS_BEAT"
  | "EPS_MISS"
  | "EPS_IN_LINE"
  | "STRONG_EPS_GROWTH"
  | "EPS_DECLINE"
  | "STRONG_REVENUE_GROWTH"
  | "REVENUE_DECLINE"
  | "ACCELERATING_GROWTH"
  | "DECELERATING_GROWTH"
  | "MARGIN_EXPANSION"
  | "MARGIN_CONTRACTION";

export interface EarningsEPS {
  estimate: number | null;
  actual: number | null;
  surprise_pct: number | null;
}

export interface EarningsRevenue {
  actual: number | null;
  yoy_growth_pct: number | null;
  qoq_growth_pct: number | null;
}

export interface EarningsQuarter {
  fiscal_quarter: string;
  period_end: string | null;
  report_date: string | null;
  eps: EarningsEPS;
  revenue: EarningsRevenue;
  net_income: number | null;
  gross_margin_pct: number | null;
  operating_margin_pct: number | null;
  eps_yoy_growth_pct: number | null;
  signals: EarningsSignal[];
  commentary: string;
}

export interface NextEarnings {
  date_range: string[];
  eps_estimate: number | null;
  revenue_estimate: number | null;
}

export interface EarningsResponse {
  ticker: string;
  retrieved_at: string;
  quarters_returned: number;
  next_earnings: NextEarnings | null;
  quarters: EarningsQuarter[];
}

// --- OHLCV Types ---

export interface OHLCVBar {
  time: string; // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVResponse {
  ticker: string;
  period: "1y" | "2y" | "5y" | "max";
  bars: number;
  data: OHLCVBar[];
}

export type OHLCVPeriod = "1y" | "2y" | "5y" | "max";

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

// --- Strategy Types ---

export type StrategyMode = "BULL" | "BULL_VOLATILE" | "CORRECTION" | "BEAR" | "RECOVERY";
export type BRSignalType = "BR_SHORT" | "BR_LONG";

export interface ShortTarget {
  price: number;
  pct_drop: number;
  source: string;
}

export interface ShortConviction {
  tier: string;
  position_multiplier: number;
  rationale: string;
}

export interface ShortFactorScore {
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  wave: number;
  total: number;
  sector_adjustment: number;
  adjusted_total: number;
  details?: Record<string, number>;
}

export interface ShortCandidate {
  ticker: string;
  action: string;
  rank: number;
  conviction: ShortConviction;
  factor_score: ShortFactorScore;
  entry_price: number;
  stop_loss: number;
  targets: ShortTarget[];
  risk_reward_ratio: number;
  screener_category: string;
  screener_stage: string;
  screener_signals: string;
  sector: string;
  industry?: string;
  sector_rank?: number;
  sector_tier?: string;
  close_price: number;
}

export interface ShortStrategyResponse {
  short_recommendations: ShortCandidate[];
  regime: string;
  source: string;
}

export interface HedgeItem {
  instrument: string;
  direction: "LONG" | "SHORT";
  instrument_type: "futures" | "inverse_etf" | "safe_haven";
  allocation_pct: number;   // decimal, e.g. 0.10 = 10%
  notional_value?: number;
  contracts?: number;
  rationale?: string;
}

export interface HedgeResponse {
  hedges: HedgeItem[];
  strategy_mode?: StrategyMode;
  generated_at?: string;
}

export interface AllocationSplit {
  long_pct: number;
  short_pct: number;
  hedge_pct: number;
  cash_pct: number;
}

export interface AllocationResponse {
  mode: StrategyMode;
  current: AllocationSplit;
  target: AllocationSplit;
  generated_at?: string;
}

export interface BRSignal {
  ticker: string;
  signal_type: BRSignalType;
  close_price: number;
  rsi: number;
  volume_ratio?: number;
  bb_upper?: number;
  bb_lower?: number;
  urgency?: string;
  description?: string;
}

export interface BRSignalsResponse {
  br_signals: BRSignal[];
  generated_at?: string;
}

export interface IntermarketAsset {
  ticker?: string;
  vs_spy_20d_pct: number;
  vs_spy_50d_pct: number;
  signal: "OUTPERFORMING" | "UNDERPERFORMING" | "NEUTRAL";
}

export interface IntermarketSignalsResponse {
  risk_signal: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
  gld: IntermarketAsset;
  tlt: IntermarketAsset;
  uup: IntermarketAsset;
  commentary?: string;
  generated_at?: string;
}

export interface DailyStrategyResponse {
  strategy_mode: StrategyMode;
  allocation_targets?: AllocationSplit;
  buy_actions?: BuyRecommendation[];
  short_actions?: ShortCandidate[];
  hedge_actions?: HedgeItem[];
  exit_actions?: ExitSignal[];
  generated_at?: string;
}

// ─── Market Direction (composite header feed) ─────────────────────────────────

export type SignalColor = "green" | "amber" | "yellow" | "orange" | "red" | "gray";

export interface VixSignal {
  level: number;
  regime: "LOW" | "NORMAL" | "HIGH" | "CRISIS";
  slope: "RISING" | "FALLING" | "FLAT";
  slope_value: number;
  trend_interpretation?: string;
  color: SignalColor;
}

export interface StrategyModeSignal {
  base: StrategyMode;
  effective: string;
  color: SignalColor;
  reason?: string;
}

export interface GexSignal {
  regime: "POSITIVE_GAMMA" | "NEGATIVE_GAMMA" | "NEUTRAL";
  magnitude: "LOW" | "MEDIUM" | "HIGH";
  total_gex: number;
  color: SignalColor;
  interpretation?: string;
}

export interface GammaFlipSignal {
  strike: number;
  distance_pct: number;
  above_flip: boolean;
  near_flip: boolean;
  es_equivalent_stop?: number;
  color: SignalColor;
}

export interface GammaWallLevel {
  strike: number;
  oi: number;
  designation: "support" | "resistance";
  strength: "LOW" | "MEDIUM" | "HIGH";
}

export interface CollarLevelDetail {
  strike: number;
  spy: number;
  distance_pct: number;
}

export interface CollarSignal {
  active_fund: string;
  reset_date: string;
  days_until_reset: number;
  reset_warning: boolean;
  // The live /api/market/direction response mirrors /api/collar/active's
  // shape exactly (collar_levels, nullable in the "not yet configured"
  // state - see CollarActiveResponse) rather than a separate "levels"
  // field - kept as CollarActiveResponse["collar_levels"] so both callers
  // share one null-safe resolution path.
  collar_levels: CollarActiveResponse["collar_levels"];
  current_spy?: number | null;
  position_in_collar: "near_floor" | "mid_range" | "near_cap" | null;
  pinning_risk: boolean;
  floor_breach_risk: boolean;
  color: SignalColor;
}

export interface CTAInstrumentSignal {
  score: number;
  label: "LONG" | "SHORT" | "NEUTRAL" | "MAX_LONG" | "MAX_SHORT";
  max_position: boolean;
  next_sell_trigger?: { level: number; distance_pct: number };
  next_buy_trigger?: { level: number; distance_pct: number };
  color: SignalColor;
}

export interface CTAAlert {
  instrument: string;
  message: string;
  distance_pct: number;
}

export interface CTASignal {
  aggregate_equity_bias: number;
  risk_on_off: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
  es?: CTAInstrumentSignal;
  nq?: CTAInstrumentSignal;
  gc?: CTAInstrumentSignal;
  alerts?: CTAAlert[];
}

export interface MarketWarning {
  type: string;
  source: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface MarketDirectionResponse {
  as_of: string;
  next_update_at?: string;
  spy_spot: number;
  spy_change_pct?: number;
  vix: VixSignal;
  strategy_mode: StrategyModeSignal;
  allocation: { long: number; short: number; hedge: number; cash: number };
  gex: GexSignal;
  gamma_flip: GammaFlipSignal;
  gamma_walls: GammaWallLevel[];
  jpm_collar?: CollarSignal;
  cta?: CTASignal;
  warnings?: MarketWarning[];
}

// ─── Collar ───────────────────────────────────────────────────────────────────

export interface SisterFund {
  fund: string;
  reset_date: string;
  days: number;
  active: boolean;
  status?: string;
}

export interface CollarActiveResponse {
  active_fund: string;
  reset_date: string;
  days_until_reset: number;
  collar_levels: {
    // backend may use either naming convention - can also be null
    // ("not_yet_configured" state) when no strikes have been entered yet
    long_put_strike?: number;
    long_put?: number;
    short_put_strike?: number;
    short_put?: number;
    short_call_strike?: number;
    short_call?: number;
    spy_equivalent?: {
      long_put: number;
      short_put?: number;
      short_call: number;
    };
  } | null;
  sister_funds?: SisterFund[];
  current_spy?: number;
  position_in_collar?: "near_floor" | "mid_range" | "near_cap";
  distance_to_floor_pct?: number;
  distance_to_cap_pct?: number;
  reset_warning?: boolean | string | null;
  floor_breach_risk?: boolean;
  pinning_risk?: boolean;
  data_source?: string;
  last_updated?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Layered Stock Filter Types
// ──────────────────────────────────────────────────────────────────────────────

export interface FunnelStats {
  universe_count: number;
  after_layer1: number;
  after_layer2: number;
  after_layer3: number;
  after_layer4: number;
  returned: number;
  inflow_sectors: string[];
  outflow_sectors: string[];
}

export interface FilterSectorContext {
  etf: string;
  name: string;
  passed_layer1: boolean;
  flow_direction: "inflow" | "outflow";
  weekly_flow_dollars: number | null;
  composite_score: number;
  pct_20d: number;
  tier: SectorTier;
  stock_count_after_l2: number;
}

export interface FilterResult {
  rank: number;
  ticker: string;
  close_price: number;
  sector: string;
  sector_etf: string;
  industry: string;
  sector_flow_direction: "inflow" | "outflow";
  sector_weekly_flow_dollars: number | null;
  sector_composite_score: number;
  sector_pct_20d: number;
  sector_tier: SectorTier;
  sma200_rising: boolean;
  close_vs_sma200_pct: number;
  trend_score: number;
  rs_vs_spy: number;
  rs_vs_etf: number;
  rs_composite: number;
  rs_52w_high: boolean;
  momentum_score: number;
  rsi_regime: "STRONG" | "BULLISH" | "UNKNOWN";
  near_20d_high: boolean;
  at_20d_high: boolean;
  consolidation_break: boolean;
  flow_score: number;
  cf_score: number;
  mom_score: number;
  adv_dollars: number;
  rvol: number;
  cmf: number;
  rsi: number;
  category: string;
  stage: string;
  signals: string;
}

export interface FilterSetupResponse {
  as_of: string;
  funnel_stats: FunnelStats;
  results: FilterResult[];
  sector_context: FilterSectorContext[];
}

export interface FilterParams {
  limit?: number;
  sector?: string;
  min_adv?: number;
  category?: string;
  require_rs_52w_high?: boolean;
  min_momentum_score?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Capital Flow Types
// ──────────────────────────────────────────────────────────────────────────────

export type FlowGaugeColor = "GREEN" | "AMBER" | "RED";
export type COTStance = "NET_LONG" | "NET_SHORT";
export type FlowDirection = "inflow" | "outflow";
export type ConvergenceSignal = "BULLISH" | "BEARISH" | "DIVERGENT" | "LEANING_LONG" | "LEANING_SHORT";
export type RotationQuadrant = "LEADING" | "WEAKENING" | "LAGGING" | "IMPROVING";

export interface MarketGauge {
  color: FlowGaugeColor;
  sectors_above_60: number;
  sectors_below_40: number;
  breadth_pct: number;
}

export interface FlowStock {
  rank: number;
  ticker: string;
  sector: string;
  sector_etf: string;
  industry: string;
  close_price: number;
  adv_dollars: number;
  flow_score: number;
  flow_score_prev: number;
  flow_score_wow: number;
  cf_score: number;
  cf_max: number;
  trend_score: number;
  trend_max: number;
  mom_score: number;
  mom_max: number;
  rvol: number;
  cmf: number;
  rsi: number;
  is_new_this_week: boolean;
  weeks_on_list: number;
  score_history: number[];
  category: string;
  stage: string;
  signals: string;
}

export interface FlowLeadersResponse {
  as_of: string;
  market_gauge: MarketGauge;
  theme: string;
  leaders: FlowStock[];
}

export interface FlowExitsResponse {
  as_of: string;
  exits: FlowStock[];
}

export interface AssetClassFlow {
  asset_class: string;
  key_etfs: string[];
  weekly_flow_dollars: number;
  daily_flow_dollars: number;
  flow_direction: FlowDirection;
}

export interface COTPosition {
  market: string;
  group: "COMMODITIES" | "EQUITIES_VOLATILITY" | "RATES_CURRENCY" | "CRYPTO";
  net_contracts: number;
  stance: COTStance;
  wow_change: number | null;
}

export interface ConvergenceRow {
  market: string;
  etf_weekly_flow: number;
  etf_flow_direction: FlowDirection;
  cot_net: number;
  cot_stance: COTStance;
  signal: ConvergenceSignal;
}

export interface SectorFlow {
  etf: string;
  name: string;
  composite_score: number;
  wow_change: number;
  weekly_flow_dollars: number | null;
  monthly_flow_dollars: number | null;
  flow_aum_pct: number | null;
  rank: number;
  prev_rank: number | null;
  tier: SectorTier;
  sparkline: number[];
  flow_confirm: boolean;
}

export interface SectorRotationPoint {
  etf: string;
  name: string;
  trend_strength: number;
  momentum: number;
  composite_score: number;
  quadrant: RotationQuadrant;
}

export interface IndustryFlow {
  etf: string;
  industry: string;
  weekly_flow_dollars: number;
  flow_aum_pct: number;
}

export interface InternationalFlow {
  etf: string;
  region: string;
  weekly_flow_dollars: number;
  flow_direction: FlowDirection;
}

export interface FlowMapResponse {
  as_of: string;
  market_summary: MarketGauge;
  asset_class_flows: AssetClassFlow[] | null;
  cot_positions: COTPosition[] | null;
  convergence_signals: ConvergenceRow[] | null;
  sector_flows: SectorFlow[];
  sector_rotation: SectorRotationPoint[];
  industry_flows: IndustryFlow[] | null;
  international_flows: InternationalFlow[] | null;
  intermarket: IntermarketSignalsResponse | null;
}

export interface SectorSnapshot {
  date: string;
  composite_score: number;
  rank: number;
  tier: SectorTier;
}

export interface SectorHistoryResponse {
  weeks: string[];
  sectors: Record<string, { name: string; snapshots: SectorSnapshot[] }>;
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

export interface CTATrigger {
  level: number;
  distance_pct: number;
  rule?: string;
}

export interface CTACOTVerification {
  managed_money_net: number;
  our_proxy: number;
  divergence_pct: number;
}

export interface CTAInstrumentFull {
  symbol: string;
  positioning_score: number;
  positioning_label: "LONG" | "SHORT" | "NEUTRAL" | "MAX_LONG" | "MAX_SHORT";
  max_position_flag?: boolean;
  next_sell_trigger?: CTATrigger;
  next_buy_trigger?: CTATrigger;
  "20ma"?: number;
  "50ma"?: number;
  "100ma"?: number;
  "200ma"?: number;
  slope_20ma?: string;
  slope_50ma?: string;
  cot_verification?: CTACOTVerification;
  last_flip_date?: string;
  days_since_flip?: number;
}

export interface CTAAggregate {
  equity_bias: number;
  commodities_bias: number;
  bonds_bias: number;
  risk_on_off: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
}

export interface CTAFullResponse {
  as_of_date: string;
  instruments: CTAInstrumentFull[];
  aggregate: CTAAggregate;
  alerts: CTAAlert[];
  data_source?: string;
  last_updated?: string;
}

/* ── Phase 1: Daily Digest + Scorecard (docs/ALPHASTREAM_UX_REDESIGN.md §5.1) ── */

export interface DigestSetup {
  direction: string;
  entry_zone: string;
  stop: string;
  target_1: string;
  reward_vs_risk: string;
  hold_days?: number | null;
  micro_contracts?: number | null;
}

export interface DigestFuturesEntry {
  ticker: string;
  available: boolean;
  bias?: "LONG" | "SHORT" | "NEUTRAL" | string;
  tier?: string;
  action_code?: "STAND_ASIDE" | "ENTER_NOW" | "ENTER_ON_PULLBACK" | string;
  action_plain?: string;
  bottom_line: string;
  whats_happening?: string[];
  setup?: DigestSetup | null;
  risks?: string[];
  ai_narrative?: string;
  ai_action_narrative?: string;
}

export interface DigestGexEntry {
  ticker: string | null;
  available: boolean;
  regime?: "STABLE" | "PINNED" | "VOLATILE" | "SQUEEZE_PRONE" | "UNKNOWN" | string;
  bottom_line: string;
  whats_happening?: string[];
  proximity_plain?: string[];
  risks?: string[];
  ai_narrative?: string;
}

export interface DailyDigest {
  date: string;
  generated_at?: string;
  is_today: boolean;
  session_date?: string;
  ai_narrative_used?: boolean;
  futures: Record<string, DigestFuturesEntry>;
  gex: Record<string, DigestGexEntry>;
  risks: string[];
}

export interface ScorecardBucket {
  n: number;
  win_rate: number | null;
  avg_r: number | null;
  expired?: number;
}

export interface ScorecardOpenPosition {
  id: string;
  kind: string;
  direction: "long" | "short" | string;
  logged_date: string;
  entry_zone?: [number, number] | number[] | null;
  stop?: number | null;
  target_1?: number | null;
  tier?: string | null;
  confidence?: number | null;
  fill_date?: string | null;
}

export interface ScorecardResponse {
  headline: string;
  as_of?: string;
  overall: ScorecardBucket;
  not_filled?: number;
  open?: number;
  by_instrument: Record<string, ScorecardBucket>;
  by_direction: Record<string, ScorecardBucket>;
  open_positions: ScorecardOpenPosition[];
}

/* ── Phase 2: Futures Plan, GEX Alerts, Dealer Flow, Backtest Reviews ──
   docs/ALPHASTREAM_UX_REDESIGN.md §5.1/§3.3-3.5 */

export interface FuturesExpectedMove {
  daily: number;
  weekly: number;
}

export interface FuturesPatternSignal {
  breakout_score: number;
  tier: string;
  category: string;
  pattern_points: number;
  reason: string | null;
}

export interface FuturesEventRules {
  suppress_new_entries: boolean;
  stop_multiplier: number;
  notes: string[];
}

export interface FuturesSetup {
  entry_zone: [number, number];
  entry_node_sources: string[];
  stop: number;
  target_1: number;
  target_2?: number;
  rr_t1: number | null;
  expected_holding_days: [number, number];
  time_stop: string;
  condition: string;
  risk_per_contract_usd: number;
  micro_risk_usd: number;
  contracts_1pct_risk: number;
  micro_contracts_1pct_risk: number;
  position_notional_full: number;
  position_notional_micro: number;
  margin_required_full: number;
  margin_required_micro: number;
}

export interface FuturesLevel {
  price: number;
  kind: "support" | "resistance";
  sources: string[];
  strength: number;
  weight: number;
  pct_from_spot: number;
}

export interface FuturesInstrumentPlan {
  instrument: string;
  future: string;
  proxy: string;
  date: string;
  spot: number;
  atr14: number;
  proxy_ratio: number;
  expected_move: FuturesExpectedMove;
  bias: "LONG" | "SHORT" | "NEUTRAL" | string;
  confidence: number;
  bias_score: number;
  conviction_score: number;
  tier: string;
  pattern_signal?: FuturesPatternSignal | null;
  reason_trail: string;
  today_action: "STAND_ASIDE" | "ENTER_NOW" | "ENTER_ON_PULLBACK" | string;
  event_rules: FuturesEventRules;
  long_setup?: FuturesSetup | null;
  short_setup?: FuturesSetup | null;
  invalidation?: string | null;
  level_ladder: FuturesLevel[];
}

export interface FuturesPlanResponse {
  date: string;
  generated_at: string;
  is_today: boolean;
  plans: Record<string, FuturesInstrumentPlan | null>;
}

/* ── GEX alerts (app/gex_alert.py::build_alert) ── */

export interface GexRegime {
  regime: "STABLE" | "PINNED" | "VOLATILE" | "SQUEEZE_PRONE" | "UNKNOWN" | string;
  note: string;
  net_gex: number | null;
  flip_strike: number | null;
  flip_distance_pct: number | null;
}

export interface GexLevels {
  nearest_breakout: number | null;
  ceiling: number | null;
  magnet: number | null;
  cascade: number | null;
}

export interface GexProximityAlert {
  strike: number;
  pct_away: number;
  direction: string;
  label: "star node" | "breakout" | "ceiling" | "magnet" | "cascade" | string;
}

export interface GexVanna {
  regime: string;
  net_vex_near_spot: number | null;
}

export interface GexCharmAnchor {
  strike: number | null;
  pin_pressure: "DOWN" | "UP" | "AT_PIN" | "NEUTRAL" | string;
  front_cex: number | null;
  pct_from_spot: number | null;
}

export interface GexPinRisk {
  dominant_strike: number | null;
  dominant_kind: string | null;
  pin_risk_dollars: number | null;
  star_nodes: number[];
}

export interface GexAlert {
  ticker: string;
  date: string;
  generated_at: string;
  spot: number;
  regime: GexRegime;
  levels: GexLevels;
  proximity_alerts: GexProximityAlert[];
  vanna: GexVanna;
  charm_anchor: GexCharmAnchor;
  dealer_bias: "selling" | "buying" | "neutral" | string;
  net_cex_front: number | null;
  pin_risk: GexPinRisk;
  conditional: string | null;
  summary: string;
}

export interface GexAlertsResponse {
  date: string;
  alerts: Record<string, GexAlert | null>;
  note: string | null;
}

/* ── Raw dealer-flow snapshot (app/dealer_flow.py) ── */

export interface DealerFlowNode {
  price: number;
  kind: "support" | "resistance";
  character: "magnet_wall" | "accelerant" | string;
  share: number;
  strength: number;
  gex: number;
  cex: number;
  pct_from_spot: number;
}

export interface DealerFlowTotals {
  net_gex: number | null;
  front_week_gex: number | null;
  net_vex_near_spot: number | null;
  net_cex_front: number | null;
  gamma_flip_strike?: number | null;
}

export interface DealerFlowSnapshot {
  ticker: string;
  date: string;
  retrieved_at?: string;
  spot: number;
  expiries: string[];
  dtes: number[];
  strikes: number[];
  gex: number[][];
  vex: number[][];
  cex: number[][];
  oi?: number[][];
  strike_totals: Record<string, { gex: number; vex: number; cex: number; oi?: number }>;
  totals: DealerFlowTotals;
  signals: {
    node_ladder: DealerFlowNode[];
    charm_anchor: GexCharmAnchor;
    vanna_regime: { regime: string; net_vex_near_spot: number | null };
    conditional_statement: string | null;
  };
}

/* ── Backtest reviews (app/backtest_review.py) ── */

export interface BacktestFinding {
  id: string;
  severity: "CRITICAL" | "WARN" | "INFO";
  summary: string;
  recommendation: string;
  plan_section?: string;
  metrics?: Record<string, unknown>;
}

export interface BacktestBucket {
  n: number;
  avg_r: number | null;
  total_r?: number | null;
}

export interface BacktestReportSummary {
  instruments: string[];
  total_setups_generated: number;
  resolved: number;
  still_open_at_data_end: number;
  not_filled: number;
  win_rate: number | null;
  avg_r: number | null;
  total_r: number | null;
  max_drawdown_r: number | null;
  sharpe_like_r: number | null;
  by_instrument: Record<string, BacktestBucket>;
  by_direction: Record<string, BacktestBucket>;
  years_covered: string[];
  best_year?: { year: string; n: number; avg_r: number } | null;
  worst_year?: { year: string; n: number; avg_r: number } | null;
}

export interface BacktestReview {
  reviewed_at: string;
  report_window: { start: string | null; end: string | null };
  verdict: string;
  finding_counts: { CRITICAL: number; WARN: number; INFO: number };
  report_summary: BacktestReportSummary;
  findings: BacktestFinding[];
}

export interface BacktestReviewsResponse {
  reviews: {
    futures: BacktestReview | null;
    breakout: BacktestReview | null;
  };
}

// ---------------------------------------------------------------------------
// Desk brief — nightly desk state, thesis book, research reports
// (trading-discovery-engine app/desk_state.py, app/thesis_book.py,
//  app/ranker.py, app/leans.py; served by app/routers/desk.py)
// ---------------------------------------------------------------------------

export interface DeskNode {
  price: number;
  kind: "support" | "resistance";
  character: "magnet_wall" | "accelerant";
  share: number;
  strength: number;
  gex: number;
  cex: number;
  pct_from_spot: number;
}

export interface DeskDealer {
  date: string | null;
  spot: number | null;
  net_gex: number | null;
  front_week_gex: number | null;
  gamma_flip: number | null;
  charm_anchor: number | null;
  pin_pressure: string | null;
  vanna_regime: string | null;
  conditional: string | null;
  max_dte: number | null;
  expiries: number;
  node_ladder: DeskNode[];
  quality: "full" | "partial";
  repaired: boolean;
  net_gex_chg_1: number | null;
  net_gex_vs_1: string | null;
  net_gex_chg_5: number | null;
  net_gex_vs_5: string | null;
}

export interface DeskBreadth {
  date: string;
  universe_size: number;
  latest: {
    pct_above_10: number | null;
    pct_above_20: number;
    pct_above_50: number;
    pct_above_100: number | null;
    pct_above_200: number;
    advances: number;
    declines: number;
    ad_ratio: number;
    up_down_vol_ratio: number | null;
    net_new_highs: number;
  };
  mcclellan: number | null;
  hindenburg: {
    fired_today: boolean;
    fires_in_window: number;
    last_fire: string | null;
    confirmed: boolean;
    index_check: boolean | null;
    error?: string;
  } | null;
  zweig_thrust: { active: boolean; trigger_date: string | null; days_ago: number | null } | null;
  divergence: { flag: boolean } | null;
}

export interface DeskBasket {
  members_used: number;
  members_total: number;
  missing: string[];
  ret_5d: number | null;
  ret_20d: number | null;
  pct_above_20: number | null;
  pct_above_50: number | null;
  pct_above_200: number | null;
  damage_pct: number | null;
  oversold: number | null;
  stress: number | null;
  stress_chg_5: number | null;
  score: number | null;
  score_chg_5: number | null;
  rank: number | null;
  rank_chg_5: number | null;
  rank_chg_10: number | null;
  rank_chg_20: number | null;
}

export interface DeskIndexSplit {
  members: number;
  weighted_members: number;
  ew_ret_5d: number | null;
  cw_ret_5d: number | null;
  ew_ret_20d: number | null;
  cw_ret_20d: number | null;
  ew_minus_cw_20d?: number;
  ew_pct_above_50: number | null;
  cw_pct_above_50: number | null;
  ew_pct_above_200: number | null;
  cw_pct_above_200: number | null;
  weights_as_of: string | null;
}

export interface DeskBaskets {
  date: string;
  baskets: Record<string, DeskBasket>;
  leaderboard: string[];
  indexes: Record<string, DeskIndexSplit>;
}

export interface DeskMacroRule {
  name: string;
  rule: string;
  state: "RISK-ON" | "RISK-OFF" | null;
  ratio?: number;
  average?: number;
  vs_average_pct?: number;
  sessions_in_state?: number;
  as_of?: string;
}

export interface DeskMacroRegime {
  rules: DeskMacroRule[];
  risk_on_count: number;
  rules_scored: number;
  composite_pct: number | null;
  regime: "RISK-ON" | "RISK-OFF" | null;
}

export interface DeskNetLiquidity {
  as_of: string;
  definition: string;
  level_bn: number;
  chg_1w_bn: number;
  chg_4w_bn: number;
  state: "SUPPORTIVE" | "UNSUPPORTIVE" | "MIXED";
  components_bn: { fed_assets: number; tga: number; reverse_repo: number };
  history: { date: string; net_bn: number }[];
}

export interface DeskWashoutSession {
  date: string;
  names: number;
  bb_count: number;
  bb_share_pct: number;
  bb_percentile: number;
  rsi_count: number;
  rsi_share_pct: number | null;
  rsi_percentile: number | null;
}

export interface DeskWashout {
  date: string;
  rules: { bb: string; rsi: string };
  sessions: DeskWashoutSession[];
  bb_names_today: string[];
}

export interface DeskGate {
  metal: string;
  verdict: "TAILWIND" | "NEUTRAL" | "HEADWIND" | "UNKNOWN";
  drift_estimate_pct: number | null;
  real_yield_chg_20d_bps: number | null;
  dxy_chg_20d_pct: number | null;
}

export interface DeskDollarRates {
  dxy: { level: number | null; stack: string | null; chg_20d_pct: number | null } | null;
  real_yield: { level_pct: number | null; chg_20d_bps: number | null } | null;
  equity_headwind: boolean | null;
  gold_gate: DeskGate | null;
  silver_gate: DeskGate | null;
}

export type LeanKey = "d3" | "d10" | "d20" | "crash20";

export interface DeskLeans {
  date: string;
  leans: Record<string, Partial<Record<LeanKey, number>>>;
  printable: Partial<Record<LeanKey, boolean>>;
  validation: Partial<Record<LeanKey, {
    within_date_auc: number | null;
    brier_skill: number | null;
    pooled_auc: number | null;
    printable: boolean;
    folds: number;
  }>>;
  trained_through: string;
  note: string;
}

export interface ThesisRuleResult {
  met: boolean | null;
  observed: unknown;
  text: string;
  target?: unknown;
}

export type ThesisStatus = "CONFIRMED" | "BUILDING" | "DORMANT" | "INVALIDATED";

export interface ThesisEpisode {
  trigger_date: string;
  instrument: string | null;
  conviction: number;
  invalidated_on: string | null;
  outcome: number | null;
  base_rate?: number;
}

export interface ThesisRow {
  id: string;
  version: number;
  key: string;
  title: string;
  direction: string;
  horizon: number;
  instrument: string | null;
  why: string;
  registered: string;
  status: ThesisStatus;
  conviction: number;
  support_met: number;
  support_n: number;
  confirm_met: number;
  confirm_n: number;
  rules: {
    support: ThesisRuleResult[];
    confirm: ThesisRuleResult[];
    invalidate: ThesisRuleResult[];
  };
  open_episode: ThesisEpisode | null;
}

export interface BootstrapCI {
  mean: number;
  ci_low: number;
  ci_high: number;
  n_blocks: number;
  n_boot: number;
  includes_zero: boolean;
}

export interface ThesisScore {
  key: string;
  episodes: number;
  scored: number;
  hit_rate?: number;
  base_rate?: number;
  excess_ci: BootstrapCI | null;
  verdict: "INSUFFICIENT_DATA" | "EDGE" | "NO_EDGE";
}

export interface ThesisBook {
  date: string;
  generated_at: string;
  theses: ThesisRow[];
  scorecard: ThesisScore[];
  note: string;
  file_date?: string;
  is_today?: boolean;
}

export interface DeskState {
  date: string;
  generated_at: string;
  brief_date: string | null;
  file_date: string;
  is_today: boolean;
  inputs: Record<string, boolean>;
  header: Record<string, unknown> | null;
  header_changes: Record<string, { now: number | null; chg_1: number | null; chg_5: number | null }>;
  dealer: Record<string, DeskDealer | null>;
  breadth: DeskBreadth | null;
  baskets: DeskBaskets | null;
  macro_regime: DeskMacroRegime | null;
  net_liquidity: DeskNetLiquidity | null;
  washout: DeskWashout | null;
  dollar_rates: DeskDollarRates | null;
  leans: DeskLeans | null;
  theses: ThesisBook | null;
  plumbing?: DeskPlumbing | null;
}

export interface DeskSeriesRow {
  date: string;
  spy_net_gex: number | null;
  qqq_net_gex: number | null;
  spy_quality: string | null;
  pct_above_50: number | null;
  mcclellan: number | null;
  macro_risk_on: number | null;
  net_liquidity_bn: number | null;
  top_basket: string | null;
  spx_ew_minus_cw_20d: number | null;
}

export interface ThesisHistoryResult {
  key: string;
  title: string;
  verdict: "INSUFFICIENT_DATA" | "EDGE" | "NO_EDGE" | "NOT_RECONSTRUCTABLE";
  rules_used?: string[];
  rules_dropped?: string[];
  episodes?: number;
  hit_rate?: number | null;
  base_rate?: number | null;
  excess_ci?: BootstrapCI | null;
  first_date?: string | null;
  last_date?: string | null;
  recent_triggers?: string[];
}

export interface ThesisHistoryReport {
  generated_at: string;
  universe_size: number;
  sessions: number;
  caveats: string[];
  results: ThesisHistoryResult[];
}

export interface RankerOverall {
  gap_r: number | null;
  top_n: number;
  ci: BootstrapCI | null;
  deciles: { decile: number; mean_r: number; n: number }[];
}

export interface RankerReport {
  run_id: string;
  generated_at: string;
  labelled_trades: number;
  oos_n: number;
  oos_pool_mean_r: number | null;
  features: string[];
  feature_coverage: Record<string, number>;
  settings: Record<string, number>;
  per_fold: {
    year: number;
    train_n: number;
    test_n: number;
    gap_gbm: number | null;
    gap_ridge: number | null;
    gap_breakout_score: number | null;
  }[];
  overall: Record<"gbm" | "ridge" | "breakout_score", RankerOverall>;
  verdict: {
    status: "PASS" | "FAIL" | "INSUFFICIENT_DATA";
    model: string;
    gap_r: number | null;
    folds: number;
    ci_lo: number | null;
    ci_hi: number | null;
    bar: { min_gap_r: number; min_folds: number; ci_lo_above: number };
  };
  ridge_coefficients: { feature: string; coef: number }[];
  /** Fill-conditioning check: top quintile chosen among ALL setups. */
  sensitivity_all_setups?: {
    setups: number;
    /** Filled AND resolved (open fills count as unlabelled). */
    filled: number;
    folds?: number;
    models: Record<"gbm" | "ridge" | "breakout_score", { gap_r: number | null; top_filled_n: number; ci: BootstrapCI | null }>;
  } | null;
}

export interface LeansValidation {
  horizon: number;
  folds: number;
  oos_rows: number;
  pooled_auc?: number;
  within_date_auc?: number | null;
  within_date_auc_ci?: BootstrapCI | null;
  brier_skill?: number | null;
  brier_improvement_ci?: BootstrapCI | null;
  base_rate?: number;
  printable: boolean;
}

export interface LeansReport {
  generated_at: string;
  trained_through: string;
  rows: number;
  baskets: number;
  features: string[];
  crash_drop_pct: number;
  first_test_year: number;
  validation: Record<LeanKey, LeansValidation>;
}

// ---------------------------------------------------------------------------
// Liquidity layer 1 — US plumbing (trading-discovery-engine app/plumbing.py,
// tested by app/liquidity_test.py)
// ---------------------------------------------------------------------------

export type PlumbingState = "STRESS" | "DRAINING" | "EASING" | "NEUTRAL";

export interface DeskPlumbing {
  as_of: string;
  rule_version: number;
  state: PlumbingState;
  warning: boolean;
  sessions_in_state: number;
  reserves_bn: number | null;
  reserves_chg13w_pct: number | null;
  reserves_vs_52w_pct: number | null;
  tga_bn: number | null;
  tga_chg20_bn: number | null;
  rrp_bn: number | null;
  repo_5d_max_bn: number | null;
  sofr_spread_bp: number | null;
  /** 3-day mean minus its 60-session median: what rule v2 thresholds. */
  sofr_jump_bp: number | null;
  effr_spread_bp: number | null;
  effr_jump_bp: number | null;
  policy_rate_pct: number | null;
  flags: Partial<Record<"sofr_stress" | "effr_stress" | "repo_usage" | "reserves_drain" | "tga_drain", boolean>>;
  tga_source: string | null;
  tga_crosscheck: { dates: number; median_abs_pct: number | null; ok: boolean } | null;
  /** Inputs that were unavailable tonight: the reading is degraded. */
  missing?: string[];
  history: { date: string; state: PlumbingState; sofr_spread_bp: number | null; reserves_bn: number | null; tga_bn: number | null }[];
}

export interface LiquidityEpisode {
  peak: string;
  /** Highest close in the 60 sessions before the -7% close: the slide's top. */
  local_peak?: string;
  on_during_decline?: boolean;
  hit: string;
  trough: string;
  depth_pct: number;
  recovered: string | null;
  warned: boolean;
  lead_sessions: number | null;
}

export interface LiquidityCrashTest {
  sessions: number;
  share_warning: number | null;
  label: string;
  base_rate: number | null;
  hit_rate_when_warning: number | null;
  excess: number | null;
  excess_ci: BootstrapCI | null;
  episodes: LiquidityEpisode[];
  episodes_n: number;
  episodes_warned: number;
  episodes_on_during_decline?: number;
  warning_onsets: number;
  onsets_per_year: number;
  false_alarm_share: number | null;
}

export interface LiquidityStrategy {
  sharpe: number | null;
  cagr_pct: number | null;
  max_dd_pct: number;
  time_invested?: number;
}

export interface LiquidityReport {
  generated_at: string;
  layer: string;
  rule: { version: number; registered: string } & Record<string, number | string>;
  bars: Record<string, number | string>;
  data: { tga_source?: string; tga_crosscheck?: { dates: number; median_abs_pct: number | null; ok: boolean } };
  state_share: Partial<Record<PlumbingState, number>>;
  state_share_by_year?: Record<string, Partial<Record<PlumbingState, number>>>;
  crash_warning: LiquidityCrashTest;
  risk_dial: {
    sessions: number;
    start: string | null;
    end: string | null;
    strategies: Record<"buy_hold" | "rule_200d" | "layer_only" | "rule_200d_and_layer", LiquidityStrategy>;
    sharpe_diff_vs_200d: { diff: number; ci_low: number; ci_high: number; n_blocks: number } | null;
  };
  components: Record<string, {
    share_warning: number | null;
    hit_rate_when_warning: number | null;
    excess: number | null;
    excess_ci: BootstrapCI | null;
    episodes_warned: number;
    episodes_n: number;
  }>;
  verdict: { crash_warning: "PASS" | "FAIL" | "INSUFFICIENT_DATA"; risk_dial: "PASS" | "FAIL" | "INSUFFICIENT_DATA"; warned_share: number };
  caveats: string[];
}
