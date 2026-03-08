# AlphaStream: Non-AI Feature Roadmap — Data-Driven & UI-Only

## Context

AlphaStream is a stock discovery dashboard (Next.js 16 + Python trading engine) with screening, market reports, resistance analysis, sector rotation, global markets, and news feeds. The trading engine backend exposes ~22 data endpoints with rich technical data (stages, categories, signals, SMA positions, RSI, percent changes, resistance levels with source metadata, business summaries, full-text news).

**The problem**: The frontend only surfaces ~70% of available backend data. Key fields like `pct_chg_1d/5d/20d`, `sma50_position`, `sma200_position`, `rsi_14`, resistance `source`, and news `full_text` are returned by the API but never displayed. There's no aggregate market internals view, no session-to-session comparison, no signal-based filtering, no keyboard navigation, no data export, no saved scans, and no portfolio tracking.

**Constraints**:
1. **No generative AI features** — no LLM calls, no streaming text, no AI-generated content
2. **Leverage the existing trading engine backend** wherever possible
3. Standalone UI-only features are welcome where valuable

**Goal**: Surface existing data in powerful new ways, add user state that creates lock-in, and build workflow tools that save time — all without any AI generation.

---

## Tier 1: Ship First — Highest ROI (Features 1-7)

These surface existing data that's already returned but hidden, or add primitives that create daily return behavior.

---

### #1. Enriched Screener Table (pct_chg, SMA, RSI columns)
| Effort | Impact |
|--------|--------|
| **S** (1-2 days) | **HIGH** |

The screener table shows only ticker, price, stage, category, signals, sector. But `InstrumentEntry` (from session reports) already carries `pct_chg_1d`, `pct_chg_5d`, `pct_chg_20d`, `sma50_position`, `sma200_position`, and `rsi_14`. Add a column toggle dropdown (persisted in `app-store`) that lets users show/hide these columns. Merge `InstrumentEntry` data by ticker into the screener table.

**Backend**: `/api/sessions/{id}/report` (already fetched via `useSessionReport`)
**Why #1**: Every trader wants momentum data and RSI at a glance. This is the highest-leverage change because the data already exists and is already being fetched.

**Key files**: Modify `src/app/screener/page.tsx`, `src/stores/app-store.ts` (add column toggle state)

---

### #2. Signal-Based Filtering
| Effort | Impact |
|--------|--------|
| **S** (1 day) | **HIGH** |

Signals are displayed as pills but there's no way to filter by signal. The five known signals (Hidden Accumulation, Power Turn, VCP Pinch, Whale Footprints, Wyckoff Spring — defined in `SIGNAL_DESCRIPTIONS` in `src/lib/constants.ts`) are high-value trading triggers. Add a multi-select filter dropdown in screener and uptrend pages that filters rows where `signals` contains the selected signal strings.

**Backend**: Client-side only — filters existing `ScreenerResult.signals` and `UptrendStock.signals`
**Why #2**: "Show me only VCP Pinch stocks" is the kind of scan traders run daily. Signals are the core differentiator of the screening engine.

**Key files**: Modify `src/app/screener/page.tsx`, `src/app/uptrend/page.tsx`

---

### #3. Keyboard Navigation & Command Palette (Cmd+K)
| Effort | Impact |
|--------|--------|
| **M** (2-3 days) | **HIGH** |

No keyboard shortcuts exist. Add: `Cmd+K` or `/` for quick ticker search (command palette with fuzzy search over routes + recent tickers), `J/K` for table row navigation, `Enter` to open selected ticker, `F` to toggle favorite, `Esc` to close modals. Register a global keydown listener in `app-shell.tsx`.

**Backend**: UI-only
**Why #3**: Keyboard shortcuts create muscle memory. Once a trader learns `Cmd+K → ticker → Enter`, they'll never use a slower workflow. Strongest lock-in after personalized data.

**Key files**: Create `src/components/layout/command-palette.tsx`, `src/hooks/use-keyboard-shortcuts.ts`. Modify `src/components/layout/app-shell.tsx`

---

### #4. Market Internals Dashboard (Stage Distribution Heatmap)
| Effort | Impact |
|--------|--------|
| **M** (3-4 days) | **HIGH** |

No aggregate "market breadth" view exists. Using batch screen data (already returns all universe tickers with `category`), compute and display:
- Stage distribution bar chart (how many stocks in Stage 1, 2, 3, 4, S, A, B, X)
- Sector-by-stage heatmap grid (rows = 11 sectors from `SECTOR_ETF_NAMES`, columns = stages, cells = count with color intensity using `STAGE_COLORS`)
- Stage 2-to-Stage 4 ratio as a single "market health" number

This becomes a top card on the Overview page or a dedicated `/internals` route.

**Backend**: `/api/batch/screen` (already used by screener), `/api/sectors/{etf}/tickers` for per-sector breakdown
**Why #4**: Market breadth (how many stocks in uptrends vs downtrends) is the primary risk-on/risk-off signal. "Should I be buying today?" — this answers it.

**Key files**: Create `src/components/overview/market-internals.tsx` or `src/app/internals/page.tsx`. Uses existing `useBatchScreen` hook.

---

### #5. Session-to-Session Comparison (Diff View)
| Effort | Impact |
|--------|--------|
| **M** (3-4 days) | **HIGH** |

Sessions list shows metadata but no comparison. Add a "Compare" mode: select two sessions, fetch both reports via `api.sessionReport()`, then display:
- Stocks that changed stage (upgraded/downgraded)
- New signals that appeared
- Stocks that entered or exited Stage 2
- Sector rotation shifts (sector-level stage distribution changes)

Pure diff computation on two `MarketReport.instruments[]` arrays, matched by ticker.

**Backend**: `/api/sessions/{id}/report` called twice
**Why #5**: "What changed since yesterday?" is the daily trader question. Stage transitions (1→2 = buy signal, 3→4 = sell signal) are the most actionable events.

**Key files**: Modify `src/app/sessions/page.tsx` or create `src/app/sessions/compare/page.tsx`. Uses existing `useSessionReport` hook.

---

### #6. Watchlist Live Enrichment (Live Data in Sidebar)
| Effort | Impact |
|--------|--------|
| **S** (1-2 days) | **HIGH** |

Sidebar favorites show only ticker names as pills grouped by sector. Enrich each favorite with live screening data: tiny `StageBadge` for category, color-coded 1d% change, and an alert dot if new signals appeared. Call `api.batchScreen()` with the favorites list on app load.

**Backend**: `/api/batch/screen?tickers=...` with favorites list
**Why #6**: Making the watchlist show live data turns it from a bookmark list into a real-time portfolio monitor. Strongest daily-open motivator.

**Key files**: Modify `src/components/layout/sidebar-favorites.tsx`. Add `useBatchScreen(favorites)` call.

---

### #7. Resistance Source Labels
| Effort | Impact |
|--------|--------|
| **S** (< 1 day) | **MEDIUM** |

`ResistanceLevel` has a `source` field (pivot, MA, swing) that's never displayed. Add a small label/icon next to each resistance level in the uptrend table and resistance summary card showing its source.

**Backend**: `/api/resistance/{ticker}` (already fetched, `source` already in response)
**Why it matters**: Traders care whether resistance comes from a prior pivot high (strong) vs a moving average (weaker). Small change, outsized informational value.

**Key files**: Modify resistance display in `src/app/uptrend/page.tsx`, `src/components/ticker/resistance-summary-card.tsx`

---

## Tier 2: Build Next — Strong Value (Features 8-14)

New user-state primitives, workflow tools, and novel data combinations.

---

### #8. Saved Scans (Persisted Filter Presets)
| Effort | Impact |
|--------|--------|
| **S** (1-2 days) | **MEDIUM** |

New `scans-store.ts` (Zustand + localStorage, following existing store patterns) saves named filter combinations: category, sector, industry, signal filter, sort column/direction. "Save Scan" button in screener/uptrend pages. Dropdown to load saved scans. Scans appear in sidebar under a "SCANS" section.

**Backend**: UI-only (localStorage)
**Key files**: Create `src/stores/scans-store.ts`. Modify `src/app/screener/page.tsx`, `src/components/layout/sidebar.tsx`

---

### #9. Ticker Comparison View (Side-by-Side)
| Effort | Impact |
|--------|--------|
| **M** (3-4 days) | **MEDIUM** |

`/compare` route where users select 2-4 tickers and see charts, screener data, resistance levels, and news side by side. "Compare" button on ticker detail page. Comparison tray in bottom bar for collecting tickers.

**Backend**: `/api/chart/{ticker}`, `/api/resistance/{ticker}` per ticker (existing hooks)
**Key files**: Create `src/app/compare/page.tsx`, `src/stores/compare-store.ts`

---

### #10. News Full-Text Reader
| Effort | Impact |
|--------|--------|
| **S** (< 1 day) | **MEDIUM** |

`TickerNewsArticle` has a `full_text` field that's extracted via trafilatura but never displayed. Add an expandable "Read Full Article" section below each news item. Data is already fetched — no additional API call.

**Backend**: `/api/news/{ticker}` (already returns `full_text`)
**Key files**: Modify `src/components/news/ticker-news-panel.tsx` or article drawer component

---

### #11. Portfolio Tracker (Entry Price + P&L)
| Effort | Impact |
|--------|--------|
| **M** (3-5 days) | **MEDIUM** |

New `portfolio-store.ts`: `{ ticker, entryPrice, entryDate, notes, quantity?, targetPrice?, stopPrice? }`. "Add to Portfolio" button on ticker page captures entry price (defaults to current `close_price`). Dedicated `/portfolio` page with P&L calculations (current price from batch screen minus entry price), portfolio-level stats (total P&L, win rate, best/worst performer).

**Backend**: `/api/batch/screen?tickers=...` for current prices
**Key files**: Create `src/stores/portfolio-store.ts`, `src/app/portfolio/page.tsx`

---

### #12. Export to CSV/Clipboard
| Effort | Impact |
|--------|--------|
| **S** (1 day) | **MEDIUM** |

"Export" button on every table (screener, uptrend, sector tickers) exports currently visible (filtered + sorted) data to CSV download or copies to clipboard as tab-separated values (pasteable into Excel/Sheets). Generic `exportToCSV(columns, rows)` utility.

**Backend**: UI-only
**Key files**: Create `src/lib/export-utils.ts`. Add export buttons to `src/app/screener/page.tsx`, `src/app/uptrend/page.tsx`

---

### #13. Sector Rotation Visualization (RRG-Style Quadrant)
| Effort | Impact |
|--------|--------|
| **M** (3-4 days) | **MEDIUM** |

Using sector ETF screening data (11 sector ETFs in `UNIVERSE.sectors`), build a sector rotation quadrant chart: X-axis = 5d momentum (`pct_chg_5d`), Y-axis = 20d momentum (`pct_chg_20d`). Sectors in top-right = "Leading", bottom-right = "Weakening", bottom-left = "Lagging", top-left = "Improving". Classic RRG (Relative Rotation Graph) concept from existing data.

**Backend**: `/api/batch/screen?tickers=XLK,XLC,...` or `/api/sessions/{id}/report` for `InstrumentEntry` data
**Key files**: Create `src/components/sectors/sector-rotation-chart.tsx`. Can integrate into `/sectors` or `/overview`.

---

### #14. Business Summary Tooltip on Hover
| Effort | Impact |
|--------|--------|
| **S** (1-2 days) | **LOW-MEDIUM** |

`ChartResponse` returns `business_summary` (shown only on ticker detail). Add tooltip/popover on ticker names in tables (screener, uptrend, sector) showing business summary on hover. Lazy-fetch via `api.chart()` with react-query caching.

**Backend**: `/api/chart/{ticker}` (existing)
**Key files**: Create tooltip component, integrate into table ticker cells

---

## Tier 3: Nice to Have (Features 15-20)

Valuable but narrower use cases or higher effort.

---

### #15. Batch Resistance Analysis
| Effort | Impact |
|--------|--------|
| **M** | **MEDIUM** |

Batch-fetch `/api/resistance/{ticker}` for all favorites or all Stage 2 stocks in parallel. Display as ranked list sorted by nearest resistance % above — "what has the most room to run?" Overlaps with uptrend page but adds favorites-specific view.

---

### #16. Alert Thresholds (Client-Side Polling)
| Effort | Impact |
|--------|--------|
| **L** | **MEDIUM** |

New `alerts-store.ts` for conditions like "Alert when AAPL enters Stage 2" or "RSI < 30 for XLK." Background polling via `setInterval` calls `api.batchScreen()`, compares against thresholds, triggers browser Notification API. Only works while tab is open.

---

### #17. Screener History Timeline (Per-Ticker)
| Effort | Impact |
|--------|--------|
| **L** | **MEDIUM** |

For a given ticker, fetch screening data from multiple sessions and plot stage/category/RSI changes over time as a timeline. Requires fetching multiple session reports (slow). Best as a lazy-loaded tab on ticker detail page.

---

### #18. Theme + Accent Color Customization
| Effort | Impact |
|--------|--------|
| **S** | **LOW** |

Custom accent color picker (hex → `--accent` CSS variable), font size preference, table density toggle. Extend existing `theme-store.ts`.

---

### #19. Job Result Viewer
| Effort | Impact |
|--------|--------|
| **S** | **LOW** |

`JobStatusResponse.result` (a `Record<string, unknown>`) is never displayed. Add collapsible structured result display showing what each completed job produced (tickers screened, success/failure counts, timing).

---

### #20. Multi-Feed News Dashboard
| Effort | Impact |
|--------|--------|
| **M** | **LOW-MEDIUM** |

Unified `/news` page combining US feed, global feed, and ticker-specific news for all favorites. Group by time bucket (today/yesterday/this week). Tag articles with matched favorite tickers. "Mentions my watchlist" filter.

---

## Summary Matrix

| # | Feature | Tier | Data Source | Effort | Impact |
|---|---------|------|-------------|--------|--------|
| 1 | Enriched Screener Table | 1 | Session report `InstrumentEntry` | S | HIGH |
| 2 | Signal-Based Filtering | 1 | Client-side (existing signals) | S | HIGH |
| 3 | Keyboard Nav + Cmd+K | 1 | UI-only | M | HIGH |
| 4 | Market Internals Dashboard | 1 | Batch screen + sector tickers | M | HIGH |
| 5 | Session Diff / Comparison | 1 | Session reports x2 | M | HIGH |
| 6 | Watchlist Live Enrichment | 1 | Batch screen (favorites) | S | HIGH |
| 7 | Resistance Source Labels | 1 | Resistance endpoint (existing) | S | MEDIUM |
| 8 | Saved Scans | 2 | UI-only (localStorage) | S | MEDIUM |
| 9 | Ticker Comparison View | 2 | Chart + resistance endpoints | M | MEDIUM |
| 10 | News Full-Text Reader | 2 | News endpoint (existing `full_text`) | S | MEDIUM |
| 11 | Portfolio Tracker | 2 | Batch screen for prices | M | MEDIUM |
| 12 | Export CSV/Clipboard | 2 | UI-only | S | MEDIUM |
| 13 | Sector Rotation (RRG) | 2 | Batch screen / session report | M | MEDIUM |
| 14 | Business Summary Tooltip | 2 | Chart endpoint | S | LOW-MED |
| 15 | Batch Resistance | 3 | Resistance endpoint x N | M | MEDIUM |
| 16 | Alert Thresholds | 3 | Batch screen (polling) | L | MEDIUM |
| 17 | Screener History Timeline | 3 | Sessions + reports x N | L | MEDIUM |
| 18 | Theme Customization | 3 | UI-only | S | LOW |
| 19 | Job Result Viewer | 3 | Job status (existing) | S | LOW |
| 20 | News Dashboard | 3 | News endpoints x N | M | LOW-MED |

**All 20 features are FREE** — no external API costs, no AI provider costs.

---

## Implementation Sprints

```
Sprint 1 — Quick Wins (1-2 days each, all surface hidden data):
  #1 Enriched Screener → #2 Signal Filtering → #6 Watchlist Enrichment → #7 Resistance Sources

Sprint 2 — Experience Definers (2-4 days each, transforms app into workstation):
  #3 Keyboard + Cmd+K → #4 Market Internals → #5 Session Diff

Sprint 3 — Workflow Layer (1-2 days each, reduce daily friction):
  #8 Saved Scans → #10 News Full-Text → #12 CSV Export

Sprint 4 — Advanced Views (3-5 days each, deepen engagement):
  #9 Comparison → #11 Portfolio → #13 Sector Rotation

Backlog: #14-20 — pull in as time allows
```

---

## Critical Files

| File | Relevance |
|------|-----------|
| `src/app/screener/page.tsx` | Features #1, #2, #8, #12 |
| `src/app/uptrend/page.tsx` | Features #2, #7, #12 |
| `src/components/layout/app-shell.tsx` | Feature #3 (keyboard listener mount) |
| `src/components/layout/sidebar-favorites.tsx` | Feature #6 |
| `src/stores/favorites-store.ts` | Pattern for new stores (#8, #11, #16) |
| `src/stores/app-store.ts` | Feature #1 (column toggle state) |
| `src/lib/types.ts` | All features reference `InstrumentEntry`, `ScreenerResult`, `ResistanceLevel` |
| `src/lib/api-client.ts` | All backend integration |
| `src/lib/constants.ts` | `SIGNAL_DESCRIPTIONS`, `SECTOR_ETF_NAMES`, `STAGE_COLORS` |
| `src/hooks/use-screen.ts` | `useBatchScreen` used by #1, #4, #6, #11 |
| `src/hooks/use-sessions.ts` | `useSessionReport` used by #1, #5 |

## Verification

- **Sprint 1**: Verify enriched columns render with correct data types, signal filter reduces visible rows, sidebar shows live stage/price, resistance source labels appear
- **Sprint 2**: Verify Cmd+K opens palette and navigates, market internals computes correct stage counts, session diff highlights real stage changes
- **Sprint 3**: Verify saved scans persist across sessions, full-text expands inline, CSV downloads with correct columns
- **Build**: `npm run build` passes after each feature
- **Manual test**: Walk through daily workflow — open app → check watchlist (enriched) → scan internals → filter screener by signal → compare sessions → export results
