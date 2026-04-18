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
  rsi: number;
  pct_above_50sma: number;
  cmf: number;
  rotation_accel: number;
  // Extended fields (may not be present on older responses)
  etf_above_200d?: boolean;
  etf_200d_extension_pct?: number;
  etf_vs_spy_20d_pct?: number;
  etf_vs_spy_rs?: number;
  summary?: string;
}

export interface SectorRankingsResponse {
  rankings: SectorRanking[];
  tier_breakdown: { LEADING: string[]; NEUTRAL: string[]; LAGGING: string[] };
  generated_at: string;
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
  levels: {
    long_put: CollarLevelDetail;
    short_put?: CollarLevelDetail;
    short_call: CollarLevelDetail;
  };
  position_in_collar: "near_floor" | "mid_range" | "near_cap";
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
    // backend may use either naming convention
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
  };
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
