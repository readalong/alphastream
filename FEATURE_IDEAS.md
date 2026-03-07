# AlphaStream: Top 3 Feature Ideas

## Context

AlphaStream is a real-time stock discovery dashboard combining Minervini/Wyckoff stage classification with AI-powered chart auditing. It currently delivers daily screening sessions, market environment reports, ticker deep-dives with AI verdicts (APPROVE/REJECT/UNCLEAR), resistance level analysis, and an AI chat assistant (Alpha Lens with web search). The platform has production-grade agentic AI infrastructure: streaming LLM with tool-calling (Vercel AI SDK), a backend proxy to a Python trading engine, and Brave API web search.

**The gap**: AlphaStream excels at *discovery* ("here's what looks good") but lacks three things that create daily habits: **personalization** (it shows everyone the same thing), **forward-looking intelligence** (it reacts to today but doesn't prepare you for tomorrow), and **accountability** (it doesn't track whether its signals actually worked). The three features below close each gap.

---

## Feature 1: Morning Briefing — *"Open AlphaStream. Know exactly what to do today."*

### The Idea
A personalized AI-generated daily action plan that synthesizes the market environment report, the user's watchlist/portfolio, sector rotation signals, uptrend data, and resistance levels into a single briefing document — delivered every morning before market open. Users log their positions (entry price, size, stop) and the AI generates position-level guidance (hold, add, trim, exit) with specific price levels and reasoning.

### Why It Creates a Competitive Moat
- **Personalized signals** — generic screeners show everyone the same thing; this is *your* watchlist, *your* entries, *your* risk profile
- **AI synthesis** — combines 6+ data sources (market regime, stage classification, resistance levels, sector rotation, AI verdicts, global markets) into 1 actionable document. This would take a human analyst 45+ minutes to produce manually
- **Position memory** — tracks entry prices, holding periods, and thesis status ("NVDA: up 22% since entry, Stage 2 intact, R1 cleared — thesis confirmed")

### User Experience
1. **Portfolio Input**: From any ticker page, "Add to Portfolio" → entry price, shares, stop loss. Stored in a new Zustand store (localStorage)
2. **Briefing Page** (`/briefing`): Opens to a structured card layout:
   - **Market Posture** (1 line): Derived from `MarketReport.trading_guidance` — "Bullish regime, full sizing, favor Tech + Industrials"
   - **Portfolio Health**: Position-level AI triage — each holding rated Healthy / Watch / Exit Signal with reasoning
   - **Top New Setups** (3-5): Highest-conviction Stage 2 stocks from uptrend report, filtered by APPROVE verdict + aligned sectors
   - **Risk Radar**: Watchlist tickers with REJECT verdicts, sectors to avoid, global bearish divergences
   - **Session Stats**: "142 screened. 23 Stage 2. 8 ATH. 3 new signals on your watchlist."
3. **Follow-up Chat**: Embedded agentic AI panel — "Why did you flag INTC for exit?" / "Rank my watchlist by risk-reward"
4. **Overview Integration**: Compact briefing card on `/overview` — "3 healthy, 1 watch, 1 exit signal. 2 new setups aligned to your sectors."

### How It Leverages Existing Infrastructure
- Extends `useFavoritesStore` → new `usePortfolioStore` with entry data
- Reuses `/api/chat/route.ts` streaming + tool-calling pattern with enriched system prompt
- Reads from existing `api.sessionReport()`, `api.uptrendReport()`, `api.globalReport()`, `api.batchScreen()`
- Follows `buildSystemPrompt()` pattern from `src/lib/alpha-lens-context.ts`
- New API route `/api/briefing/route.ts` follows exact same architecture as `/api/chat/route.ts`

### Key Files
| Action | File |
|--------|------|
| Create | `src/stores/portfolio-store.ts` — Zustand store for positions |
| Create | `src/app/briefing/page.tsx` — Full briefing page |
| Create | `src/components/briefing/` — Briefing cards, portfolio health, chat panel |
| Create | `src/lib/briefing-context.ts` — System prompt builder with portfolio + market data |
| Create | `src/hooks/use-briefing.ts` — Assembles briefing data from existing endpoints |
| Create | `src/app/api/briefing/route.ts` — Agentic AI endpoint |
| Modify | `src/components/overview/` — Add compact briefing card |
| Modify | `src/components/layout/sidebar.tsx` — Add "Morning Briefing" nav link |
| Modify | `src/components/ticker/` — Add "Add to Portfolio" button |

### Why Users Come Back Daily
The briefing changes every trading day. It answers "What should I do today?" — not "What does the market look like?" Every morning, users open AlphaStream the way they check the weather: it's the first thing they look at to plan their day. The portfolio tracking creates lock-in — their data lives here.

---

## Feature 2: Catalyst Radar — *"Know what's coming before the market prices it in."*

### The Idea
An AI-powered forward-looking event intelligence system that discovers upcoming earnings dates, Fed meetings, CPI/jobs reports, sector rotation triggers, and macro events — then cross-references them against the user's watchlist/portfolio to produce a **"This Week's Landmines & Catalysts"** briefing. The agentic AI doesn't just list events — it assesses *impact probability* on each of your positions using historical precedent (via web search) and current technical setup.

### Why It Creates a Competitive Moat
- **The #1 reason traders get blindsided is events they didn't know were coming.** Catalyst Radar eliminates surprise
- **Contextual, not generic** — it's not an earnings calendar; it's "NVDA reports Thursday. You're up 23%. Historical post-earnings move: ±8%. Stage 2 intact but R1 at $145 caps upside. Consider: reduce to half-size pre-earnings"
- **AI risk scoring** — "CPI comes in hot → Fed hawkish → your Growth-heavy portfolio at risk. Hedge: XLU/XLP leaders from today's uptrend report"
- **Pre-positioning edge** — users who see catalyst + technical setup + portfolio context together make better decisions than those using any one alone
- **Leverages agentic web search** — the AI agent actively searches for upcoming events, earnings whispers, and macro data, creating a continuously refreshed intelligence feed

### User Experience
1. **Radar Dashboard** (`/radar`): Timeline view of next 7 days
   - Events tagged: Macro / Earnings / Fed / Sector / Dividend
   - Each event shows which portfolio/watchlist holdings are affected
   - Week risk score: "ELEVATED — 3 holdings report earnings, FOMC Wednesday"
2. **Event Detail Modal**: Click any event →
   - AI-generated impact brief: "FOMC Wed 2pm. If hawkish surprise → SPY -1.5%, your XLK-heavy watchlist vulnerable. If dovish → Stage 2 breakouts accelerate."
   - Affected tickers with suggested pre-event actions
   - Historical precedent (via web search): "Last 4 FOMC meetings: SPY moved ±1.2% same day"
3. **Overview Integration**: "Catalyst" card — "2 events today affecting your positions"
4. **Alpha Lens Enhancement**: "What catalysts are coming for AAPL?" → AI searches web + synthesizes with technical setup

### How It Leverages Existing Infrastructure
- Extends the Brave API web search tool already in `/api/chat/route.ts` — same `web_search` tool pattern, now used proactively for event discovery
- Reuses market environment report AI synthesis pattern from `NativeReportRenderer`
- Connects to portfolio/favorites store for personalized impact assessment
- New agentic workflow: AI agent searches for events → matches against user's ticker universe → scores impact per holding
- Follows the `streamText` + `stepCountIs(5)` multi-step agent loop

### Key Files
| Action | File |
|--------|------|
| Create | `src/app/radar/page.tsx` — Catalyst Radar dashboard |
| Create | `src/components/radar/` — Timeline, event cards, impact modals, risk score |
| Create | `src/hooks/use-catalyst-radar.ts` — TanStack Query hook |
| Create | `src/lib/radar-context.ts` — System prompt for event discovery + impact assessment |
| Create | `src/app/api/radar/route.ts` — Agentic AI endpoint with web search tools |
| Modify | `src/components/overview/` — Add catalyst briefing card |
| Modify | `src/components/layout/sidebar.tsx` — Add "Catalyst Radar" nav link |
| Modify | `src/lib/constants.ts` — Add macro event type constants |

### Why Users Come Back Daily
Markets present new risks every day. Earnings, Fed meetings, economic data — each is a potential landmine or catalyst. Users will check Catalyst Radar before market open (what's coming today?), before major events (should I reduce size before FOMC?), and after surprises (what does this CPI print mean for my positions?). The forward-looking nature means there's always something new on the timeline.

---

## Feature 3: Scenario War Room — *"Stress-test your thesis before you risk your capital."*

### The Idea
An agentic AI feature where users type a macro scenario ("SPY drops 5%", "Fed cuts rates", "Tech rotates to Value", "VIX spikes above 30") and the AI cross-references it against their watchlist, current market regime, sector exposures, and resistance levels to produce a structured impact assessment with ticker-by-ticker triage. This is the "what if" analysis that institutional desks run but retail traders never get access to.

### Why It Creates a Competitive Moat
- **No retail tool does this.** Scenario analysis with personalized portfolio context is an institutional-grade capability
- **Combines forward reasoning with hard data** — the AI doesn't just speculate; it uses your tickers' actual stages, resistance levels, and sector exposures to ground its analysis
- **Historical grounding via web search** — "The last time VIX spiked above 30, Stage 2 stocks with weak volume lost an average of 12% within 2 weeks" (sourced from web search)
- **Builds conviction** — users who stress-test before acting trade with more confidence and better sizing
- **Creates a decision journal** — saved scenarios become a record of the user's evolving market thesis

### User Experience
1. **Scenario Input** (`/scenarios`): Prominent text input with pre-built templates:
   - "SPY drops 5% in the next week"
   - "Fed announces surprise rate cut"
   - "Tech sector rotates to Value"
   - "Crypto crashes 20%"
   - "VIX spikes above 30"
   - Custom freeform input
2. **Click "Run Scenario"** → Agentic AI produces structured output:
   - **Regime Shift**: How the scenario changes the market regime ("Bullish → Cautious, position sizing Full → Half")
   - **Sector Impact**: Winners and losers mapped against user's watchlist exposure
   - **Watchlist Triage**: Each ticker categorized HOLD / TRIM / EXIT with scenario-specific reasoning
   - **Resistance Relevance**: Which uptrend stocks would likely test R1/R2/R3
   - **Historical Analog**: What happened in past instances (via web search)
   - **Recommended Actions**: 2-3 concrete steps
3. **Follow-up Chat**: "What if it's a 10% drop instead?" / "Focus on my tech positions"
4. **Scenario History**: Last 10 scenarios saved with timestamps — compare how thinking evolved

### How It Leverages Existing Infrastructure
- Uses `streamText` + multi-tool agent pattern from `/api/chat/route.ts`
- Tools: `web_search` (existing Brave API pattern) + new `lookup_ticker` tool (calls existing `api.screen()` + `api.resistance()`)
- `stepCountIs(5)` allows multi-step reasoning: search precedents → look up tickers → cross-reference market data → produce assessment
- Reads from `useFavoritesStore` / `usePortfolioStore` for personalization
- Structured output follows `MetricTile` / `BadgeChip` patterns from `NativeReportRenderer`
- Scenario regime shifts map directly to existing `MarketReport` type fields (phase, stance, position sizing)

### Key Files
| Action | File |
|--------|------|
| Create | `src/app/scenarios/page.tsx` — Scenario War Room page |
| Create | `src/components/scenarios/` — Input, results, triage table, history sidebar |
| Create | `src/stores/scenario-store.ts` — Persists scenario history |
| Create | `src/lib/scenario-context.ts` — System prompt with scenario + market + portfolio data |
| Create | `src/app/api/scenarios/route.ts` — Agentic AI endpoint with multiple tools |
| Create | `src/hooks/use-scenario.ts` — Manages scenario execution state |
| Modify | `src/components/layout/sidebar.tsx` — Add "War Room" nav link |

### Why Users Come Back Daily
Markets present new "what ifs" every single day. Before earnings week: "What if NVDA misses?" Before FOMC: "What if they're hawkish?" After a gap down: "What if this is the start of a correction?" The scenario history becomes a decision journal that compounds in value. Users develop the habit of stress-testing before acting — and AlphaStream is the only place they can do it with their actual positions and real technical data.

---

## The Daily Flywheel

Together, these three features transform AlphaStream from a *discovery tool you check occasionally* into a **daily operating system for trading**:

| Time | Action | Feature |
|------|--------|---------|
| **Pre-market** | "What should I do today?" | Morning Briefing |
| **Pre-market** | "What events are coming this week?" | Catalyst Radar |
| **During session** | "What if SPY breaks below the 50-day?" | Scenario War Room |
| **During session** | Discover new setups | Existing Screener + Alpha Lens |
| **Post-market** | "What changed on my watchlist?" | Morning Briefing (portfolio tracking) |

Each feature feeds the others: the Morning Briefing references Catalyst Radar events ("NVDA reports Thursday — consider trimming"). The Catalyst Radar personalizes using portfolio data from the Briefing. The Scenario War Room stress-tests the positions that the Briefing recommended. **More usage = more data = better AI signals = more trust = more usage.**

---

## Implementation Order

| Priority | Feature | Rationale |
|----------|---------|-----------|
| **1st** | Morning Briefing | Creates the portfolio store that Features 2 & 3 depend on. Establishes the daily habit loop immediately. |
| **2nd** | Catalyst Radar | Adds forward-looking intelligence. Requires portfolio data from Feature 1 for personalization. |
| **3rd** | Scenario War Room | Most complex agentic feature. Benefits from the portfolio + catalyst infrastructure already in place. |

## Verification

For each feature:
1. **Morning Briefing**: Add 3 test positions → verify AI generates personalized briefing with position-level triage → verify Alpha Lens knows portfolio context → verify overview card renders
2. **Catalyst Radar**: Verify event discovery via web search returns structured events → verify portfolio cross-referencing highlights affected holdings → verify overview integration
3. **Scenario War Room**: Run "SPY drops 5%" scenario → verify structured output with regime shift + watchlist triage → verify follow-up chat works → verify scenario saves to history
