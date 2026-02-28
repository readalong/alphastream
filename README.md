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

Create `.env.local` (already included):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=local
```

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
| `/settings` | Theme, API URL, API key, data preferences |

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

### API Integration

The app consumes the Trading Discovery Engine REST API. All API types are defined in `src/lib/types.ts` and the typed fetch wrapper is in `src/lib/api-client.ts`.

Key features:
- Health status dot in topbar (polls every 30s)
- Job polling (3s interval while running)
- Configurable backend URL and API key via Settings page

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
