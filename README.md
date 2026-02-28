# AlphaStream

Real-time stock discovery dashboard that surfaces actionable trade ideas by combining classical technical analysis (Minervini/Wyckoff stage classification) with AI-powered chart auditing.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand (theme + app config, persisted to localStorage)
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Trading Discovery Engine backend running on `http://localhost:8000`

### Install & Run

```bash
npm install
npm run dev
```

The frontend starts at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000   # baked into client bundle (used by app store)
BACKEND_URL=http://localhost:8000           # server-side only — used by the API proxy
NEXT_PUBLIC_APP_ENV=local
GOOGLE_GENERATIVE_AI_API_KEY=...           # AI provider key for Alpha Lens chat
AI_PROVIDER=google                          # anthropic | openai | google
BRAVE_SEARCH_API_KEY=...                    # optional — enables web search in Alpha Lens
```

`BACKEND_URL` and any `BACKEND_API_KEY` are read only by the server-side proxy route and are never exposed to the browser.

## Pages

| Route | Description |
|-------|-------------|
| `/overview` | Market dashboard — indices, sectors, crypto, commodities with stage badges |
| `/screener` | Bulk screening results with filtering and sorting |
| `/ticker` | Ticker search landing page |
| `/ticker/[symbol]` | Deep-dive — chart image, screener card, AI analysis |
| `/sessions` | Browse historical screening sessions |
| `/sessions/[id]` | Session detail with AI report embed |
| `/jobs` | Trigger and monitor backend pipeline jobs |
| `/settings` | Theme, Google Gemini key, data preferences |

## Architecture

```
src/
├── app/            # Next.js App Router pages
├── components/     # React components
│   ├── layout/     # Sidebar, topbar, app shell
│   └── charts/     # Stage badge, static chart renderer
├── hooks/          # TanStack Query hooks (screen, chart, analyze, sessions, jobs, health)
├── stores/         # Zustand stores (theme, app config)
└── lib/            # API client, types, constants, utils
```

### API Integration & Proxy

All Trading Engine API calls are routed through a **server-side proxy** at `src/app/api/trading/[...path]/route.ts` rather than calling the backend directly from the browser.

```
Browser → GET /api/trading/screen/AAPL          (Next.js proxy, no key visible)
           ↓
Next.js  → GET http://backend:8000/api/screen/AAPL  (adds X-API-Key server-side)
           ↓
Browser  ← JSON response
```

**Why a proxy?**
- `BACKEND_API_KEY` is injected server-side and never appears in the client JS bundle or browser network tab
- The Trading Engine URL is a server-side env var (`BACKEND_URL`) — only `NEXT_PUBLIC_API_URL` is baked into the bundle for the app store default
- User-provided LLM keys (`X-LLM-Key` for AI analysis endpoints) are forwarded by the proxy transparently

The proxy also handles binary responses (resistance chart PNGs) and forwards `Content-Disposition` headers for file downloads.

In production (Cloud Run), `BACKEND_API_KEY` is mounted from GCP Secret Manager — it never appears in GitHub secrets or the Docker image.

All API types are defined in `src/lib/types.ts`. The typed fetch wrapper (`src/lib/api-client.ts`) uses `proxyPath()` to rewrite `/api/*` → `/api/trading/*` before calling `fetch`.

Key features:
- Health status dot in topbar (polls every 30s)
- Job polling (3s interval while running)
- Google Gemini key configurable via Settings page (forwarded to backend AI endpoints)

### Long-Running API Calls

The `/api/analyze/{ticker}` endpoint can take 30–120 seconds (AI model inference). The app handles this with a pattern that should be reused for any future slow endpoints:

1. **Extended fetch timeout** — `apiFetch()` accepts a `timeout` option (default 30s). The analyze endpoint uses `120_000` (2 minutes) via `AbortController`. A timed-out request throws a clear `"Request timed out after Xs"` error instead of hanging.
2. **No retries** — `useAnalyze` sets `retry: false` in TanStack Query config. Retrying a 2-minute call compounds wait time and confuses users. Fast endpoints keep the global `retry: 2` default.
3. **Optimistic UI** — existing page content (chart, screener card) stays visible while the analysis loads. The chart hook is never disabled, so switching to AI mode doesn't blank the page.
4. **Live elapsed timer** — a `useElapsedSeconds(isFetching)` hook ticks every second while the request is in flight, displayed as `0:45` in the loading card so users see the request is alive.
5. **Error card with retry** — on failure (timeout or server error), an error card appears with the message and a "Retry" button, rather than silently failing.

### Design System

- **Dark mode** (default) with light mode toggle
- Color-coded stage badges (Sure Shot=gold, Action=emerald, Stage 2=green, etc.)
- Inter font for body, JetBrains Mono for numbers
- Tabular numbers for price data
- Responsive sidebar (collapsible on mobile)

## Backend Setup

The backend (Trading Discovery Engine) should be running separately:

```bash
# In the trading-discovery-engine repo
poetry run uvicorn app.api:app --reload --port 8000
```

## Build

```bash
npm run build
npm start
```

## License

ISC
