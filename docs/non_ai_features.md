# AlphaStream: Non-AI Feature Roadmap — Data-Driven & UI-Only

## Status Legend

| Badge | Meaning |
|-------|---------|
| **DONE** | Fully implemented |
| **VARIATION** | A variation or partial implementation exists |
| **TODO** | Not yet implemented |

---

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

### #1. Enriched Screener Table (pct_chg, SMA, RSI columns) — **VARIATION**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1-2 days) | **HIGH** | **VARIATION** — Global Markets page (`/markets`) already shows `pct_chg_1d/5d/20d`, `sma50_position`, `sma200_position`, and `rsi_14` for index entries via `GlobalIndexCard` and `IndexDetail`. However, the **main screener table** (`/screener`) does NOT show these columns — it only displays ticker, price, stage, category, signals, sector. No column toggle exists. |

The screener table shows only ticker, price, stage, category, signals, sector. But `InstrumentEntry` (from session reports) already carries `pct_chg_1d`, `pct_chg_5d`, `pct_chg_20d`, `sma50_position`, `sma200_position`, and `rsi_14`. Add a column toggle dropdown (persisted in `app-store`) that lets users show/hide these columns. Merge `InstrumentEntry` data by ticker into the screener table.

**Backend**: `/api/sessions/{id}/report` (already fetched via `useSessionReport`)
**Why #1**: Every trader wants momentum data and RSI at a glance. This is the highest-leverage change because the data already exists and is already being fetched.

**Key files**: Modify `src/app/screener/page.tsx`, `src/stores/app-store.ts` (add column toggle state)

---

### #2. Signal-Based Filtering — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1 day) | **HIGH** | **TODO** — Signals are displayed as pills in both screener and uptrend tables but no filter UI exists. |

Signals are displayed as pills but there's no way to filter by signal. The five known signals (Hidden Accumulation, Power Turn, VCP Pinch, Whale Footprints, Wyckoff Spring — defined in `SIGNAL_DESCRIPTIONS` in `src/lib/constants.ts`) are high-value trading triggers. Add a multi-select filter dropdown in screener and uptrend pages that filters rows where `signals` contains the selected signal strings.

**Backend**: Client-side only — filters existing `ScreenerResult.signals` and `UptrendStock.signals`
**Why #2**: "Show me only VCP Pinch stocks" is the kind of scan traders run daily. Signals are the core differentiator of the screening engine.

**Key files**: Modify `src/app/screener/page.tsx`, `src/app/uptrend/page.tsx`

---

### #3. Keyboard Navigation & Command Palette (Cmd+K) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** (2-3 days) | **HIGH** | **TODO** — Only basic `Escape` key handlers exist (closing Alpha Lens panel and resistance chart modal). No Cmd+K palette, no J/K navigation, no global keyboard shortcuts. |

No keyboard shortcuts exist. Add: `Cmd+K` or `/` for quick ticker search (command palette with fuzzy search over routes + recent tickers), `J/K` for table row navigation, `Enter` to open selected ticker, `F` to toggle favorite, `Esc` to close modals. Register a global keydown listener in `app-shell.tsx`.

**Backend**: UI-only
**Why #3**: Keyboard shortcuts create muscle memory. Once a trader learns `Cmd+K → ticker → Enter`, they'll never use a slower workflow. Strongest lock-in after personalized data.

**Key files**: Create `src/components/layout/command-palette.tsx`, `src/hooks/use-keyboard-shortcuts.ts`. Modify `src/components/layout/app-shell.tsx`

---

### #4. Market Internals Dashboard (Stage Distribution Heatmap) — **VARIATION**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** (3-4 days) | **HIGH** | **VARIATION** — Sector cards (`SectorCard` + `SectorSignalBar`) already show per-sector stage distribution bars and stage counts (S, A, 2, 1). However, there is NO unified cross-sector aggregate view, no stage distribution bar chart, no sector-by-stage heatmap grid, and no "market health" number. The data is computed per-sector but never aggregated. |

No aggregate "market breadth" view exists. Using batch screen data (already returns all universe tickers with `category`), compute and display:
- Stage distribution bar chart (how many stocks in Stage 1, 2, 3, 4, S, A, B, X)
- Sector-by-stage heatmap grid (rows = 11 sectors from `SECTOR_ETF_NAMES`, columns = stages, cells = count with color intensity using `STAGE_COLORS`)
- Stage 2-to-Stage 4 ratio as a single "market health" number

This becomes a top card on the Overview page or a dedicated `/internals` route.

**Backend**: `/api/batch/screen` (already used by screener), `/api/sectors/{etf}/tickers` for per-sector breakdown
**Why #4**: Market breadth (how many stocks in uptrends vs downtrends) is the primary risk-on/risk-off signal. "Should I be buying today?" — this answers it.

**Key files**: Create `src/components/overview/market-internals.tsx` or `src/app/internals/page.tsx`. Uses existing `useBatchScreen` hook.

---

### #5. Session-to-Session Comparison (Diff View) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** (3-4 days) | **HIGH** | **TODO** — Sessions page lists sessions and shows individual session detail. No comparison or diff functionality exists. |

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

### #6. Watchlist Live Enrichment (Live Data in Sidebar) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1-2 days) | **HIGH** | **TODO** — `SidebarFavorites` shows static ticker pills grouped by sector with collapsible sections and a count badge. No live data (no stage badges, no price changes, no signal indicators). |

Sidebar favorites show only ticker names as pills grouped by sector. Enrich each favorite with live screening data: tiny `StageBadge` for category, color-coded 1d% change, and an alert dot if new signals appeared. Call `api.batchScreen()` with the favorites list on app load.

**Backend**: `/api/batch/screen?tickers=...` with favorites list
**Why #6**: Making the watchlist show live data turns it from a bookmark list into a real-time portfolio monitor. Strongest daily-open motivator.

**Key files**: Modify `src/components/layout/sidebar-favorites.tsx`. Add `useBatchScreen(favorites)` call.

---

### #7. Resistance Source Labels — **DONE**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (< 1 day) | **MEDIUM** | **DONE** — `ResistanceZoneDetail` component (`src/components/resistance/resistance-zone-detail.tsx:42-44`) displays the `source` field in expandable zone details, alongside range and touches (strength). |

`ResistanceLevel` has a `source` field (pivot, MA, swing) that's displayed in the resistance zone detail panel. The `ResistanceZoneDetail` component shows source, range, and touch count when expanded.

**Backend**: `/api/resistance/{ticker}` (already fetched, `source` already in response)
**Implementation**: `src/components/resistance/resistance-zone-detail.tsx`

---

## Tier 2: Build Next — Strong Value (Features 8-14)

New user-state primitives, workflow tools, and novel data combinations.

---

### #8. Saved Scans (Persisted Filter Presets) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1-2 days) | **MEDIUM** | **TODO** — No scan store exists. Existing stores: `app-store`, `favorites-store`, `sector-store`, `theme-store`, `uptrend-store`. |

New `scans-store.ts` (Zustand + localStorage, following existing store patterns) saves named filter combinations: category, sector, industry, signal filter, sort column/direction. "Save Scan" button in screener/uptrend pages. Dropdown to load saved scans. Scans appear in sidebar under a "SCANS" section.

**Backend**: UI-only (localStorage)
**Key files**: Create `src/stores/scans-store.ts`. Modify `src/app/screener/page.tsx`, `src/components/layout/sidebar.tsx`

---

### #9. Ticker Comparison View (Side-by-Side) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** (3-4 days) | **MEDIUM** | **TODO** — No `/compare` route exists. No comparison functionality anywhere. |

`/compare` route where users select 2-4 tickers and see charts, screener data, resistance levels, and news side by side. "Compare" button on ticker detail page. Comparison tray in bottom bar for collecting tickers.

**Backend**: `/api/chart/{ticker}`, `/api/resistance/{ticker}` per ticker (existing hooks)
**Key files**: Create `src/app/compare/page.tsx`, `src/stores/compare-store.ts`

---

### #10. News Full-Text Reader — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (< 1 day) | **MEDIUM** | **TODO** — No news component directory exists (`src/components/news/`). No `full_text` references found in frontend code. |

`TickerNewsArticle` has a `full_text` field that's extracted via trafilatura but never displayed. Add an expandable "Read Full Article" section below each news item. Data is already fetched — no additional API call.

**Backend**: `/api/news/{ticker}` (already returns `full_text`)
**Key files**: Modify `src/components/news/ticker-news-panel.tsx` or article drawer component

---

### #11. Portfolio Tracker (Entry Price + P&L) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** (3-5 days) | **MEDIUM** | **TODO** — No portfolio store, no `/portfolio` route, no portfolio references in codebase. |

New `portfolio-store.ts`: `{ ticker, entryPrice, entryDate, notes, quantity?, targetPrice?, stopPrice? }`. "Add to Portfolio" button on ticker page captures entry price (defaults to current `close_price`). Dedicated `/portfolio` page with P&L calculations (current price from batch screen minus entry price), portfolio-level stats (total P&L, win rate, best/worst performer).

**Backend**: `/api/batch/screen?tickers=...` for current prices
**Key files**: Create `src/stores/portfolio-store.ts`, `src/app/portfolio/page.tsx`

---

### #12. Export to CSV/Clipboard — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1 day) | **MEDIUM** | **TODO** — No export utility, no CSV references, no clipboard copy functionality. |

"Export" button on every table (screener, uptrend, sector tickers) exports currently visible (filtered + sorted) data to CSV download or copies to clipboard as tab-separated values (pasteable into Excel/Sheets). Generic `exportToCSV(columns, rows)` utility.

**Backend**: UI-only
**Key files**: Create `src/lib/export-utils.ts`. Add export buttons to `src/app/screener/page.tsx`, `src/app/uptrend/page.tsx`

---

### #13. Sector Rotation Visualization (RRG-Style Quadrant) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** (3-4 days) | **MEDIUM** | **TODO** — Sector cards show stage distribution bars but no RRG quadrant or momentum-based rotation visualization. |

Using sector ETF screening data (11 sector ETFs in `UNIVERSE.sectors`), build a sector rotation quadrant chart: X-axis = 5d momentum (`pct_chg_5d`), Y-axis = 20d momentum (`pct_chg_20d`). Sectors in top-right = "Leading", bottom-right = "Weakening", bottom-left = "Lagging", top-left = "Improving". Classic RRG (Relative Rotation Graph) concept from existing data.

**Backend**: `/api/batch/screen?tickers=XLK,XLC,...` or `/api/sessions/{id}/report` for `InstrumentEntry` data
**Key files**: Create `src/components/sectors/sector-rotation-chart.tsx`. Can integrate into `/sectors` or `/overview`.

---

### #14. Business Summary Tooltip on Hover — **VARIATION**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1-2 days) | **LOW-MEDIUM** | **VARIATION** — Business summary IS displayed on the ticker detail page (`/ticker/[symbol]`) as a `BusinessSummaryCard` with expand/collapse. But it is NOT available as a hover tooltip in tables (screener, uptrend, sector). |

`ChartResponse` returns `business_summary` (shown on ticker detail page via `BusinessSummaryCard`). Add tooltip/popover on ticker names in tables (screener, uptrend, sector) showing business summary on hover. Lazy-fetch via `api.chart()` with react-query caching.

**Backend**: `/api/chart/{ticker}` (existing)
**Key files**: Create tooltip component, integrate into table ticker cells

---

## Tier 3: Nice to Have (Features 15-20)

Valuable but narrower use cases or higher effort.

---

### #15. Batch Resistance Analysis — **VARIATION**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** | **MEDIUM** | **VARIATION** — The uptrend page (`/uptrend`) already fetches resistance data for all Stage 2 stocks via `useUptrendReport` and displays R1/R2/R3 columns with percentage above. However, there is no favorites-specific batch resistance view or "most room to run" ranking. |

Batch-fetch `/api/resistance/{ticker}` for all favorites or all Stage 2 stocks in parallel. Display as ranked list sorted by nearest resistance % above — "what has the most room to run?" Overlaps with uptrend page but adds favorites-specific view.

---

### #16. Alert Thresholds (Client-Side Polling) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **L** | **MEDIUM** | **TODO** |

New `alerts-store.ts` for conditions like "Alert when AAPL enters Stage 2" or "RSI < 30 for XLK." Background polling via `setInterval` calls `api.batchScreen()`, compares against thresholds, triggers browser Notification API. Only works while tab is open.

---

### #17. Screener History Timeline (Per-Ticker) — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **L** | **MEDIUM** | **TODO** |

For a given ticker, fetch screening data from multiple sessions and plot stage/category/RSI changes over time as a timeline. Requires fetching multiple session reports (slow). Best as a lazy-loaded tab on ticker detail page.

---

### #18. Theme + Accent Color Customization — **VARIATION**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** | **LOW** | **VARIATION** — Dark/light/system theme toggle is implemented (`theme-store.ts`, `ThemeToggle` component, Settings page). However, accent color picker, font size preference, and table density toggle are NOT implemented. |

Custom accent color picker (hex → `--accent` CSS variable), font size preference, table density toggle. Extend existing `theme-store.ts`.

---

### #19. Job Result Viewer — **DONE**
| Effort | Impact | Status |
|--------|--------|--------|
| **S** | **LOW** | **DONE** — `JobResultSummary` component in `src/app/jobs/page.tsx` displays structured job results. Shows tickers screened, session IDs, AI success/fail status, and tickers processed depending on job type. Results appear inline in the job card after completion. |

`JobStatusResponse.result` is displayed via `JobResultSummary` in the jobs page. Shows type-specific result summaries (instruments analyzed, tickers screened, AI status) with fallback to truncated JSON for unknown types.

**Implementation**: `src/app/jobs/page.tsx` — `JobResultSummary` component

---

### #20. Multi-Feed News Dashboard — **TODO**
| Effort | Impact | Status |
|--------|--------|--------|
| **M** | **LOW-MEDIUM** | **TODO** — No `/news` route exists. No news components directory. |

Unified `/news` page combining US feed, global feed, and ticker-specific news for all favorites. Group by time bucket (today/yesterday/this week). Tag articles with matched favorite tickers. "Mentions my watchlist" filter.

---

## Additional Feature Ideas (Not in Original 20)

These are features discovered during the codebase audit that would add value but weren't in the original roadmap.

---

### #21. Ticker Search with Autocomplete
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1 day) | **HIGH** | **TODO** |

The ticker lookup page (`/ticker`) exists but is a bare search page. Add an autocomplete dropdown that fuzzy-matches against the full universe of tickers (already defined in `UNIVERSE` constant). Show sector and latest stage badge in the suggestion dropdown. This could be the foundation for Feature #3 (Cmd+K palette).

**Backend**: Client-side — `UNIVERSE` already contains all tickers
**Key files**: Modify `src/app/ticker/page.tsx`, potentially reusable as a shared component

---

### #22. Uptrend "Room to Run" Sort & Highlight
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (< 1 day) | **MEDIUM** | **VARIATION** — R1 sort exists, but no visual highlight for stocks with >15% room to R1 or color gradient by distance. |

Add visual highlighting to the uptrend table: green gradient for stocks with the most room to R1 (>15% above), yellow for moderate (5-15%), red for tight (<5%). Makes the "best setups" visually pop without requiring sorting.

**Backend**: Client-side only
**Key files**: Modify `src/components/uptrend/resistance-cell.tsx`

---

### #23. Session ZIP Download from Sessions List
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (< 1 day) | **LOW** | **VARIATION** — Session detail page has ZIP download capability, but the sessions list page doesn't expose it inline. |

Add a download button directly to each row in the sessions list page, so users don't need to navigate to the detail page to download.

**Key files**: Modify `src/app/sessions/page.tsx`

---

### #24. Sector Drill-Down Breadcrumbs & Industry Signal Bars
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (1 day) | **MEDIUM** | **VARIATION** — Sector breadcrumbs exist (`SectorBreadcrumb`), sector signal bars exist (`SectorSignalBar`), and industry cards exist (`IndustryCard`). Could enhance industry-level pages with the same signal bar treatment sectors get. |

Add `SectorSignalBar` to the industry-level page (`/sectors/[etf]/[industry]`) to show stage distribution within an industry. Currently industry pages show tickers but no aggregate stage breakdown.

**Key files**: Modify `src/app/sectors/[sector_etf]/[industry]/page.tsx`

---

### #25. Screener Count Badges in Sidebar
| Effort | Impact | Status |
|--------|--------|--------|
| **S** (< 1 day) | **MEDIUM** | **TODO** |

Show small count badges next to sidebar nav items: how many Stage 2 stocks (Screener), how many with resistance (Uptrend), how many favorites. Gives at-a-glance market pulse without navigating.

**Backend**: Uses existing batch screen data
**Key files**: Modify `src/components/layout/sidebar.tsx`

---

## Summary Matrix

| # | Feature | Tier | Status | Data Source | Effort | Impact |
|---|---------|------|--------|-------------|--------|--------|
| 1 | Enriched Screener Table | 1 | **VARIATION** | Session report `InstrumentEntry` | S | HIGH |
| 2 | Signal-Based Filtering | 1 | **TODO** | Client-side (existing signals) | S | HIGH |
| 3 | Keyboard Nav + Cmd+K | 1 | **TODO** | UI-only | M | HIGH |
| 4 | Market Internals Dashboard | 1 | **VARIATION** | Batch screen + sector tickers | M | HIGH |
| 5 | Session Diff / Comparison | 1 | **TODO** | Session reports x2 | M | HIGH |
| 6 | Watchlist Live Enrichment | 1 | **TODO** | Batch screen (favorites) | S | HIGH |
| 7 | Resistance Source Labels | 1 | **DONE** | Resistance endpoint (existing) | S | MEDIUM |
| 8 | Saved Scans | 2 | **TODO** | UI-only (localStorage) | S | MEDIUM |
| 9 | Ticker Comparison View | 2 | **TODO** | Chart + resistance endpoints | M | MEDIUM |
| 10 | News Full-Text Reader | 2 | **TODO** | News endpoint (existing `full_text`) | S | MEDIUM |
| 11 | Portfolio Tracker | 2 | **TODO** | Batch screen for prices | M | MEDIUM |
| 12 | Export CSV/Clipboard | 2 | **TODO** | UI-only | S | MEDIUM |
| 13 | Sector Rotation (RRG) | 2 | **TODO** | Batch screen / session report | M | MEDIUM |
| 14 | Business Summary Tooltip | 2 | **VARIATION** | Chart endpoint | S | LOW-MED |
| 15 | Batch Resistance | 3 | **VARIATION** | Resistance endpoint x N | M | MEDIUM |
| 16 | Alert Thresholds | 3 | **TODO** | Batch screen (polling) | L | MEDIUM |
| 17 | Screener History Timeline | 3 | **TODO** | Sessions + reports x N | L | MEDIUM |
| 18 | Theme Customization | 3 | **VARIATION** | UI-only | S | LOW |
| 19 | Job Result Viewer | 3 | **DONE** | Job status (existing) | S | LOW |
| 20 | News Dashboard | 3 | **TODO** | News endpoints x N | M | LOW-MED |
| 21 | Ticker Search Autocomplete | — | **TODO** | Client-side (UNIVERSE) | S | HIGH |
| 22 | Room to Run Highlight | — | **VARIATION** | Client-side | S | MEDIUM |
| 23 | Session ZIP from List | — | **VARIATION** | Existing endpoint | S | LOW |
| 24 | Industry Signal Bars | — | **VARIATION** | Sector tickers | S | MEDIUM |
| 25 | Screener Count Badges | — | **TODO** | Batch screen | S | MEDIUM |

### Score: 2 DONE / 6 VARIATION / 17 TODO

**All features are FREE** — no external API costs, no AI provider costs.

---

## Implementation Sprints (Updated)

```
Sprint 1 — Quick Wins (1-2 days each, all surface hidden data):
  #1 Enriched Screener (extend existing variation)
  #2 Signal Filtering
  #6 Watchlist Enrichment
  #21 Ticker Search Autocomplete

Sprint 2 — Experience Definers (2-4 days each, transforms app into workstation):
  #3 Keyboard + Cmd+K
  #4 Market Internals (extend existing variation)
  #5 Session Diff

Sprint 3 — Workflow Layer (1-2 days each, reduce daily friction):
  #8 Saved Scans
  #12 CSV Export
  #25 Screener Count Badges

Sprint 4 — Advanced Views (3-5 days each, deepen engagement):
  #9 Comparison
  #11 Portfolio
  #13 Sector Rotation

Backlog: #10, #14-20, #22-24 — pull in as time allows
Already done: #7, #19
```

---

## Critical Files

| File | Relevance |
|------|-----------|
| `src/app/screener/page.tsx` | Features #1, #2, #8, #12 |
| `src/app/uptrend/page.tsx` | Features #2, #12, #22 |
| `src/components/layout/app-shell.tsx` | Feature #3 (keyboard listener mount) |
| `src/components/layout/sidebar-favorites.tsx` | Feature #6 |
| `src/components/layout/sidebar.tsx` | Features #8, #25 |
| `src/stores/favorites-store.ts` | Pattern for new stores (#8, #11, #16) |
| `src/stores/app-store.ts` | Feature #1 (column toggle state) |
| `src/stores/theme-store.ts` | Feature #18 (extend with accent/density) |
| `src/lib/types.ts` | All features reference `InstrumentEntry`, `ScreenerResult`, `ResistanceLevel` |
| `src/lib/api-client.ts` | All backend integration |
| `src/lib/constants.ts` | `SIGNAL_DESCRIPTIONS`, `SECTOR_ETF_NAMES`, `STAGE_COLORS` |
| `src/hooks/use-screen.ts` | `useBatchScreen` used by #1, #4, #6, #11, #25 |
| `src/hooks/use-sessions.ts` | `useSessionReport` used by #1, #5 |
| `src/components/sectors/sector-signal-bar.tsx` | Feature #24 (reuse in industry pages) |
| `src/components/resistance/resistance-zone-detail.tsx` | Feature #7 (already done) |
| `src/app/jobs/page.tsx` | Feature #19 (already done — `JobResultSummary`) |

## Verification

- **Sprint 1**: Verify enriched columns render with correct data types, signal filter reduces visible rows, sidebar shows live stage/price, autocomplete shows suggestions
- **Sprint 2**: Verify Cmd+K opens palette and navigates, market internals computes correct stage counts, session diff highlights real stage changes
- **Sprint 3**: Verify saved scans persist across sessions, CSV downloads with correct columns, count badges update
- **Build**: `npm run build` passes after each feature
- **Manual test**: Walk through daily workflow — open app → check watchlist (enriched) → scan internals → filter screener by signal → compare sessions → export results
