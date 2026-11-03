import type {
  HealthResponse,
  ScreenerResult,
  ChartResponse,
  AnalysisResponse,
  BatchScreenResponse,
  SessionInfo,
  JobResponse,
  JobStatusResponse,
  SectorInfo,
  IndustryInfo,
  SectorRunInfo,
  UptrendReport,
  ResistanceResponse,
  GlobalMarketReport,
  MarketReport,
  NewsFeedResponse,
  TickerNewsResponse,
  EconomicCalendarResponse,
  EconomicDataResponse,
  OHLCVResponse,
  OHLCVPeriod,
  EarningsResponse,
  RegimeResponse,
  SectorRankingsResponse,
  PortfolioHealthResponse,
  PositionsResponse,
  DailyRecommendations,
  RecommendationHistoryResponse,
  RunRecommendResponse,
  PendingBreakout,
  AddPositionRequest,
  PositionMutationResponse,
  DailyStrategyResponse,
  ShortStrategyResponse,
  HedgeResponse,
  AllocationResponse,
  BRSignalsResponse,
  IntermarketSignalsResponse,
  MarketDirectionResponse,
  CollarActiveResponse,
  CTAFullResponse,
  FlowLeadersResponse,
  FlowExitsResponse,
  FlowMapResponse,
  SectorHistoryResponse,
  FilterSetupResponse,
  FilterParams,
  DailyDigest,
  ScorecardResponse,
  FuturesPlanResponse,
  GexAlertsResponse,
  DealerFlowSnapshot,
  BacktestReviewsResponse,
  DeskState,
  DeskSeriesRow,
  ThesisBook,
  ThesisHistoryReport,
  RankerReport,
  LeansReport,
  LiquidityReport,
  BookReport,
  BookResponse,
  OpportunitiesBothResponse,
  OpportunitiesUniverse,
  CANSLIMResult,
  BreakoutsResponse,
  BreakoutChartResponse,
  BreakoutFilterParams,
  PatternType,
  PatternStage,
  ActionsResponse,
  NarrativeResponse,
  ActionsFilterParams,
} from "./types";

// All Trading Engine calls are proxied through /api/trading/[...path]
// The proxy (src/app/api/trading/[...path]/route.ts) adds X-API-Key server-side.
function proxyPath(path: string): string {
  // /api/screen/AAPL → /api/trading/screen/AAPL
  return path.replace(/^\/api\//, "/api/trading/");
}

function getLlmKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("alphastream-config");
    if (stored) {
      const parsed = JSON.parse(stored);
      return (parsed.state?.llmKey as string) || null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { timeout?: number; withLlmKey?: boolean }
): Promise<T> {
  const url = proxyPath(path);
  const timeout = options?.timeout ?? 30_000;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (options?.withLlmKey) {
    const llmKey = getLlmKey();
    if (llmKey) headers["X-LLM-Key"] = llmKey;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => apiFetch<HealthResponse>("/api/health"),

  screen: (ticker: string, refresh = false) =>
    apiFetch<ScreenerResult>(`/api/screen/${ticker}?refresh=${refresh}`),

  chart: (ticker: string, refresh = false) =>
    apiFetch<ChartResponse>(`/api/chart/${ticker}?format=json&refresh=${refresh}`),

  analyze: (ticker: string, refresh = false) =>
    apiFetch<AnalysisResponse>(`/api/analyze/${ticker}?refresh=${refresh}`, {
      timeout: 120_000,
      withLlmKey: true,
    }),

  batchScreen: (tickers: string[], refresh = false) =>
    apiFetch<BatchScreenResponse>(
      `/api/batch/screen?tickers=${tickers.join(",")}&refresh=${refresh}`
    ),

  sessions: () => apiFetch<SessionInfo[]>("/api/sessions"),

  sessionReport: (sessionId: string) =>
    apiFetch<MarketReport>(`/api/sessions/${sessionId}/report`, { withLlmKey: true }),

  sessionDownload: (sessionId: string) =>
    proxyPath(`/api/sessions/${sessionId}/download`),

  triggerJob: (jobType: string, tickers?: string) => {
    const query = tickers ? `?tickers=${tickers}` : "";
    return apiFetch<JobResponse>(`/api/jobs/${jobType}${query}`, { method: "POST" });
  },

  jobStatus: (jobId: string) =>
    apiFetch<JobStatusResponse>(`/api/jobs/${jobId}/status`),

  // Sector / Industry endpoints
  sectors: () => apiFetch<SectorInfo[]>("/api/sectors"),

  industries: (sectorEtf?: string) =>
    apiFetch<IndustryInfo[]>(
      sectorEtf ? `/api/industries?sector=${sectorEtf}` : "/api/industries"
    ),

  sectorTickers: (sectorEtf: string) =>
    apiFetch<BatchScreenResponse>(`/api/sectors/${sectorEtf}/tickers`),

  industryTickers: (industry: string) =>
    apiFetch<BatchScreenResponse>(
      `/api/industries/${encodeURIComponent(industry)}/tickers`
    ),

  sectorRuns: (sessionId: string) =>
    apiFetch<SectorRunInfo[]>(`/api/sessions/${sessionId}/sector-runs`),

  // Uptrend / Resistance endpoints
  uptrendReport: (sessionId: string) =>
    apiFetch<UptrendReport>(`/api/sessions/${sessionId}/upside-report`, { withLlmKey: true }),

  resistance: (ticker: string) =>
    apiFetch<ResistanceResponse>(`/api/resistance/${ticker}`),

  globalReport: () =>
    apiFetch<GlobalMarketReport>("/api/global-report/latest", { withLlmKey: true }),

  globalReportBySession: (sessionId: string) =>
    apiFetch<GlobalMarketReport>(`/api/sessions/${sessionId}/global-report`, { withLlmKey: true }),

  newsFeed: (feed: "us" | "global", limit = 15, offset = 0) =>
    apiFetch<NewsFeedResponse>(`/api/news/${feed}?limit=${limit}&offset=${offset}&days=7`),

  tickerNews: (ticker: string, limit = 20) =>
    apiFetch<TickerNewsResponse>(
      `/api/news/${encodeURIComponent(ticker)}?limit=${limit}`,
      { timeout: 20_000 }
    ),

  // Economic data endpoints
  economicCalendar: (week?: string) =>
    apiFetch<EconomicCalendarResponse>(
      `/api/economic/calendar${week ? `?week=${week}` : ""}`
    ),

  economicData: (week?: string) =>
    apiFetch<EconomicDataResponse>(
      `/api/economic/data${week ? `?week=${week}` : ""}`
    ),

  ohlcv: (ticker: string, period: OHLCVPeriod = "1y", refresh = false) =>
    apiFetch<OHLCVResponse>(
      `/api/ohlcv/${ticker.toUpperCase()}?period=${period}&refresh=${refresh}`
    ),

  earnings: (ticker: string, quarters = 8, refresh = false) =>
    apiFetch<EarningsResponse>(
      `/api/earnings/${ticker.toUpperCase()}?quarters=${quarters}${refresh ? "&refresh=true" : ""}`
    ),

  // Recommendations endpoints
  recommendations: (date?: string) =>
    apiFetch<DailyRecommendations>(
      date ? `/api/recommendations/${date}` : `/api/recommendations`
    ),

  recommendationHistory: (days = 5, cursor?: string) =>
    apiFetch<RecommendationHistoryResponse>(
      `/api/recommendations/history?days=${days}${cursor ? `&cursor=${cursor}` : ""}`
    ),

  addPosition: (data: AddPositionRequest) =>
    apiFetch<PositionMutationResponse>(`/api/recommendations/positions/add`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  closePosition: (ticker: string, exitPrice?: number, exitReason?: string) =>
    apiFetch<PositionMutationResponse>(`/api/recommendations/positions/close`, {
      method: "POST",
      body: JSON.stringify({ ticker, exit_price: exitPrice, exit_reason: exitReason }),
    }),

  regime: () => apiFetch<RegimeResponse>(`/api/recommendations/regime`),

  sectorRankings: () =>
    apiFetch<SectorRankingsResponse>(`/api/recommendations/sectors`),

  portfolioHealth: () =>
    apiFetch<PortfolioHealthResponse>(`/api/recommendations/portfolio/health`),

  positions: () => apiFetch<PositionsResponse>(`/api/recommendations/positions`),

  pendingBreakouts: () =>
    apiFetch<{ pending: PendingBreakout[]; count: number }>(
      `/api/recommendations/pending`
    ),

  runRecommend: (portfolioValue = 100000, sector?: string, regimeMode?: string) => {
    const params = new URLSearchParams({ portfolio_value: String(portfolioValue) });
    if (sector) params.set("sector", sector);
    if (regimeMode) params.set("regime_mode", regimeMode);
    return apiFetch<RunRecommendResponse>(
      `/api/jobs/recommend?${params}`,
      { method: "POST", timeout: 180_000 }
    );
  },

  resistanceChart: async (ticker: string): Promise<string> => {
    const res = await fetch(proxyPath(`/api/resistance/${ticker}?format=png`));
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  // Strategy endpoints
  strategy: () => apiFetch<DailyStrategyResponse>("/api/strategy"),

  strategyShorts: () => apiFetch<ShortStrategyResponse>("/api/strategy/shorts"),

  strategyHedges: () => apiFetch<HedgeResponse>("/api/strategy/hedges"),

  strategyAllocation: () => apiFetch<AllocationResponse>("/api/strategy/allocation"),

  strategyBR: () => apiFetch<BRSignalsResponse>("/api/strategy/br"),

  strategyIntermarket: () =>
    apiFetch<IntermarketSignalsResponse>("/api/strategy/intermarket"),

  runStrategy: () =>
    apiFetch<JobResponse>("/api/jobs/strategy", { method: "POST", timeout: 120_000 }),

  marketDirection: () => apiFetch<MarketDirectionResponse>("/api/market/direction"),

  collarActive: () => apiFetch<CollarActiveResponse>("/api/collar/active"),
  ctaAll: () => apiFetch<CTAFullResponse>("/api/cta"),

  // Capital Flow endpoints
  flowLeaders: (limit?: number, sector?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (sector) params.set("sector", sector);
    const qs = params.toString();
    return apiFetch<FlowLeadersResponse>(`/api/flow/leaders${qs ? `?${qs}` : ""}`);
  },

  flowExits: (limit?: number, sector?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (sector) params.set("sector", sector);
    const qs = params.toString();
    return apiFetch<FlowExitsResponse>(`/api/flow/exits${qs ? `?${qs}` : ""}`);
  },

  flowMap: () => apiFetch<FlowMapResponse>("/api/flow/map"),

  sectorHistory: () => apiFetch<SectorHistoryResponse>("/api/flow/sector-history"),

  triggerFlowJob: (options?: { include_cot?: boolean; include_etf_flows?: boolean }) =>
    apiFetch<JobResponse>("/api/jobs/flow", {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    }),

  // Layered stock filter
  filterSetup: (params?: FilterParams) => {
    const p = new URLSearchParams();
    if (params?.limit != null) p.set("limit", String(params.limit));
    if (params?.sector) p.set("sector", params.sector);
    if (params?.min_adv != null) p.set("min_adv", String(params.min_adv));
    if (params?.category) p.set("category", params.category);
    if (params?.require_rs_52w_high) p.set("require_rs_52w_high", "true");
    if (params?.min_momentum_score != null) p.set("min_momentum_score", String(params.min_momentum_score));
    const qs = p.toString();
    return apiFetch<FilterSetupResponse>(`/api/filter/setup${qs ? `?${qs}` : ""}`, {
      timeout: 120_000,
    });
  },

  triggerFilterJob: (params?: FilterParams) =>
    apiFetch<JobResponse>("/api/jobs/filter", {
      method: "POST",
      body: JSON.stringify({
        limit: params?.limit ?? 50,
        sector: params?.sector ?? null,
        min_adv: params?.min_adv ?? 5_000_000,
        category: params?.category ?? null,
        require_rs_52w_high: params?.require_rs_52w_high ?? false,
        min_momentum_score: params?.min_momentum_score ?? 15,
      }),
    }),

  // Phase 1 — daily digest + scorecard (landing page)
  digest: () => apiFetch<DailyDigest>("/api/digest"),

  scorecard: () => apiFetch<ScorecardResponse>("/api/scorecard"),

  // Phase 2 — futures plan, GEX alerts, dealer flow, backtest reviews
  futuresPlan: () => apiFetch<FuturesPlanResponse>("/api/futures/plan"),

  gexAlerts: (ticker?: string) =>
    apiFetch<GexAlertsResponse>(
      ticker ? `/api/gex/alerts?ticker=${ticker}` : "/api/gex/alerts"
    ),

  gexHeatmapUrl: (ticker: string) => proxyPath(`/api/gex/${ticker}/heatmap.png`),

  dealerFlow: (ticker: string) =>
    apiFetch<DealerFlowSnapshot>(`/api/dealer-flow/${ticker}`),

  backtestReviews: () => apiFetch<BacktestReviewsResponse>("/api/backtest/reviews"),

  // Desk brief — nightly desk state, thesis book, research reports
  deskState: () => apiFetch<DeskState>("/api/desk/state"),

  deskSeries: (days = 60) =>
    apiFetch<{ series: DeskSeriesRow[] }>(`/api/desk/series?days=${days}`),

  theses: () => apiFetch<ThesisBook>("/api/theses"),

  thesisHistory: () => apiFetch<ThesisHistoryReport>("/api/theses/history"),

  rankerReport: () => apiFetch<RankerReport>("/api/research/ranker"),

  leansReport: () => apiFetch<LeansReport>("/api/research/leans"),
  liquidityReport: (layer: "plumbing" | "positioning" = "plumbing") =>
    apiFetch<LiquidityReport>(`/api/research/liquidity?layer=${layer}`),

  bookReport: () => apiFetch<BookReport>("/api/research/book"),

  // The open book, from the ledger (setups.json) — Phase R2.
  book: () => apiFetch<BookResponse>("/api/book"),
  // Phase 5 — /opportunities (sector rotation + long/short opportunity
  // scans). A cache-miss full sp500 scan takes a few minutes server-side —
  // long timeout, and refresh must only ever come from an explicit user
  // action (never a page-load default), per docs/ALPHASTREAM_OPPORTUNITIES_UI.md.
  opportunities: (universe: OpportunitiesUniverse = "sp500", top = 15, refresh = false) =>
    apiFetch<OpportunitiesBothResponse>(
      `/api/opportunities/both?universe=${universe}&top=${top}&refresh=${refresh ? 1 : 0}`,
      { timeout: 300_000 }
    ),

  // ─── CAN SLIM endpoints ────────────────────────────────────────────────────
  canslim: (ticker: string) =>
    apiFetch<CANSLIMResult>(`/api/canslim/${ticker}`),

  breakouts: (params: BreakoutFilterParams = {}) => {
    const qs = new URLSearchParams();
    if (params.min_score != null)  qs.set("min_score", String(params.min_score));
    if (params.pattern?.length)    qs.set("pattern",   params.pattern.join(","));
    if (params.stage?.length)      qs.set("stage",     params.stage.join(","));
    if (params.days_ago != null)   qs.set("days_ago",  String(params.days_ago));
    if (params.include_extended)   qs.set("include_extended", "true");
    if (params.sector)             qs.set("sector", params.sector);
    return apiFetch<BreakoutsResponse>(`/api/canslim/breakouts?${qs.toString()}`);
  },

  breakoutChart: (
    ticker: string,
    timeframe: "weekly" | "daily" = "weekly",
    bars = 65
  ) =>
    apiFetch<BreakoutChartResponse>(
      `/api/canslim/breakouts/${ticker}/chart?format=json&timeframe=${timeframe}&bars=${bars}`
    ),

  actions: (params: ActionsFilterParams = {}) => {
    const qs = new URLSearchParams();
    if (params.min_score != null)     qs.set("min_score",     String(params.min_score));
    if (params.min_conviction != null) qs.set("min_conviction", String(params.min_conviction));
    if (params.action?.length)        qs.set("action",         params.action.join(","));
    return apiFetch<ActionsResponse>(`/api/canslim/actions?${qs.toString()}`);
  },

  narrative: () => apiFetch<NarrativeResponse>("/api/canslim/actions/narrative"),
};
