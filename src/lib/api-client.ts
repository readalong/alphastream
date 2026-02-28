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

function getConfig() {
  if (typeof window === "undefined") {
    return {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
      apiKey: null as string | null,
      llmKey: null as string | null,
    };
  }
  try {
    const stored = localStorage.getItem("alphastream-config");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        apiBaseUrl:
          (parsed.state?.apiBaseUrl as string) ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8000",
        apiKey: (parsed.state?.apiKey as string) || null,
        llmKey: (parsed.state?.llmKey as string) || null,
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    apiKey: null,
    llmKey: null,
  };
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { timeout?: number; withLlmKey?: boolean }
): Promise<T> {
  const { apiBaseUrl, apiKey, llmKey } = getConfig();
  const url = `${apiBaseUrl}${path}`;
  const timeout = options?.timeout ?? 30_000;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  if (options?.withLlmKey && llmKey) {
    headers["X-LLM-Key"] = llmKey;
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

  sessionDownload: (sessionId: string) => {
    const { apiBaseUrl } = getConfig();
    return `${apiBaseUrl}/api/sessions/${sessionId}/download`;
  },

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
    const { apiBaseUrl, apiKey } = getConfig();
    const headers: Record<string, string> = {};
    if (apiKey) headers["X-API-Key"] = apiKey;
    const res = await fetch(
      `${apiBaseUrl}/api/resistance/${ticker}?format=png`,
      { headers }
    );
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
