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
    apiFetch<UptrendReport>(`/api/sessions/${sessionId}/uptrend-report`, { withLlmKey: true }),

  resistance: (ticker: string) =>
    apiFetch<ResistanceResponse>(`/api/resistance/${ticker}`),

  globalReport: () =>
    apiFetch<GlobalMarketReport>("/api/global-report/latest", { withLlmKey: true }),

  globalReportBySession: (sessionId: string) =>
    apiFetch<GlobalMarketReport>(`/api/sessions/${sessionId}/global-report`, { withLlmKey: true }),

  resistanceChart: async (ticker: string): Promise<string> => {
    const res = await fetch(proxyPath(`/api/resistance/${ticker}?format=png`));
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
