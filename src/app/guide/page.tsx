"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Globe,
  ScanSearch,
  BarChart3,
  Waves,
  Map,
  Filter,
  Activity,
  Calendar,
  Target,
  Swords,
  Gauge,
  Shield,
  TrendingDown,
  TrendingUp,
  BarChart2,
  Search,
  Settings,
  ChevronRight,
  Lightbulb,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideSection {
  id: string;
  label: string;
  group: "discover" | "analyze" | "manage";
  icon: React.ElementType;
  href: string;
  tagline: string;
  what: React.ReactNode;
  how: React.ReactNode;
  insight: React.ReactNode;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const SECTIONS: GuideSection[] = [
  // ── DISCOVER ──────────────────────────────────────────────────────────────
  {
    id: "overview",
    label: "Overview",
    group: "discover",
    icon: LayoutDashboard,
    href: "/overview",
    tagline: "Your daily market briefing — AI report, regime, and watchlist in one place.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />AI-generated market report from the latest scan session — summarises regime, sector leadership, and notable setups.</li>
        <li><Bullet />Market regime callout: <Tag green>RISK ON</Tag> / <Tag amber>CAUTION</Tag> / <Tag red>RISK OFF</Tag> with breadth confirmation numbers.</li>
        <li><Bullet />Quick-access Watchlist (Favorites) — tickers you've starred across the app, with live screener data.</li>
        <li><Bullet />Session timestamp so you know how fresh the underlying data is.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Open Overview every morning before the US session opens.</li>
        <li><Bullet />The regime badge is the first decision gate: <Tag red>RISK OFF</Tag> = reduce size, no new longs. <Tag green>RISK ON</Tag> = full playbook in effect.</li>
        <li><Bullet />Read the AI report's sector section — it tells you which sectors are printing new highs and which are lagging.</li>
        <li><Bullet />Use the Watchlist to check overnight price action on names you're tracking.</li>
      </ul>
    ),
    insight: (
      <p>If the regime is <Tag green>RISK ON</Tag> and the AI report highlights 2–3 leading sectors, those sectors are where you run the Setup Filter next. If the regime is <Tag amber>CAUTION</Tag>, shrink position size. If <Tag red>RISK OFF</Tag>, let the portfolio sit — no new entries.</p>
    ),
  },
  {
    id: "markets",
    label: "Global Markets",
    group: "discover",
    icon: Globe,
    href: "/markets",
    tagline: "International index dashboard — where global capital is and isn't flowing.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Index cards for US (SPY, QQQ, IWM), Europe (EFA), Emerging Markets (EEM), and major developed-market ETFs.</li>
        <li><Bullet />Each card shows price, day change %, and a BULL / BEAR / CORRECTION / RECOVERY regime label.</li>
        <li><Bullet />Global synthesis card: summarises net global risk posture from cross-index breadth.</li>
        <li><Bullet />Region labels (Americas, Europe, Asia-Pacific) for quick geographic filtering.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Check this before trading opens to frame the macro backdrop.</li>
        <li><Bullet />If EEM and EFA are both in CORRECTION while SPY is BULL, that's relative US strength — concentrate capital in domestic names.</li>
        <li><Bullet />If the synthesis card shows broad RISK OFF across regions, treat it like a regime red flag even if the US scan looks clean.</li>
      </ul>
    ),
    insight: (
      <p>US outperformance against EEM+EFA is a tailwind for domestic momentum setups. Global weakness that isn't yet showing in SPY often leads by 2–4 weeks — use it as an early warning.</p>
    ),
  },
  {
    id: "screener",
    label: "Screener",
    group: "discover",
    icon: ScanSearch,
    href: "/screener",
    tagline: "Minervini/Wyckoff stage-classified universe — every stock in the database, filtered and sortable.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Full scan results from the last backend run: stage, category, signals, sector, and price for each ticker.</li>
        <li><Bullet />Category codes: <Tag green>S</Tag> Sure Shot &nbsp;<Tag blue>A</Tag> Action &nbsp;<Tag amber>B</Tag> Bounce &nbsp;<Tag muted>X</Tag> Anomaly &nbsp;<Tag muted>2</Tag> Stage 2</li>
        <li><Bullet />Signals column: pipe-delimited tags like <em>Hidden Accumulation | VCP Pinch | Pocket Pivot</em>.</li>
        <li><Bullet />Filter by sector ETF, category, or stage. Search by ticker.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Filter to <Tag green>S</Tag> and <Tag blue>A</Tag> categories — these are the highest-conviction setups per the screener framework.</li>
        <li><Bullet />Sort by sector ETF to see which sector is producing the most setups right now.</li>
        <li><Bullet />Click a ticker to go to Ticker Lookup for the full chart + AI analysis.</li>
        <li><Bullet />Star tickers to add them to your Watchlist — they'll appear on the Overview page.</li>
      </ul>
    ),
    insight: (
      <p>If a single sector is dominating the <Tag green>S</Tag>+<Tag blue>A</Tag> list (e.g. 8 of 12 results are XLK), that's sector concentration — capital is flowing into one place. Run the Setup Filter filtered to that sector to get the ranked shortlist.</p>
    ),
  },
  {
    id: "sectors",
    label: "Sectors",
    group: "discover",
    icon: BarChart3,
    href: "/sectors",
    tagline: "11 SPDR sector ETFs ranked by composite flow score — the macro rotation picture.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Card grid: each card shows sector name, ETF ticker, composite score (0–100), tier badge, and CMF (Chaikin Money Flow) bar.</li>
        <li><Bullet />Tier badges: <Tag green>Leading</Tag> = score 60+, <Tag amber>Neutral</Tag> = 40–59, <Tag red>Lagging</Tag> = below 40.</li>
        <li><Bullet />Metrics per card: vs-SPY 20d %, rotation acceleration (WoW score change), % of stocks above 50d SMA.</li>
        <li><Bullet />Click any sector card to drill into its constituent stocks, sorted by Flow Score.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Sort by Score (default) to see the rotation stack — Leading sectors at the top are where institutional money is concentrating.</li>
        <li><Bullet />Watch rotation acceleration: a sector jumping +10 WoW is accelerating into a leadership phase. A sector dropping −15 WoW is losing sponsorship fast.</li>
        <li><Bullet />Click into a Leading sector → Capital Flow tab to see which individual stocks are getting the most institutional flow within that sector.</li>
      </ul>
    ),
    insight: (
      <p>Two or more sectors simultaneously <Tag green>Leading</Tag> with positive WoW acceleration = broad bull tape. Only one <Tag green>Leading</Tag> sector = narrow market. Narrow markets require more selectivity — stick to the Setup Filter output, not gut picks.</p>
    ),
  },
  {
    id: "flow",
    label: "Capital Flow",
    group: "discover",
    icon: Waves,
    href: "/flow",
    tagline: "Stock-level institutional flow — ranked leaders accumulating capital and smart money exits.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet /><strong>Leaders tab:</strong> stocks with the highest Flow Score (0–100), ranked by institutional accumulation intensity. Each card shows CF / Trend / Momentum sub-scores, volume expansion, and sector context.</li>
        <li><Bullet /><strong>Exits tab:</strong> stocks showing Flow Score deterioration — high-velocity selling, score collapses, COLLAPSE-tagged names.</li>
        <li><Bullet />Flow Score formula: CF (0–40) + Trend (0–30) + Momentum (0–30). A score of 80+ means all three sub-systems are in gear simultaneously.</li>
        <li><Bullet />Badges: <Tag green>NEW</Tag> just entered the list, <Tag blue>SUSTAINED</Tag> multi-week leader, <Tag red>COLLAPSE</Tag> rapid score drop, <Tag amber>HIGH VOL</Tag> volume spike.</li>
        <li><Bullet />Sector dropdown filter and Market Gauge Strip showing breadth across all sectors.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />The Leaders list is your buy universe. Focus on scores 80+ — these are stocks with institutional buying, an uptrend, and current momentum all firing at the same time.</li>
        <li><Bullet /><Tag green>NEW</Tag> + high score = fresh accumulation just starting. These tend to have the most upside runway.</li>
        <li><Bullet /><Tag blue>SUSTAINED</Tag> at high score = institutional conviction. Safe to hold but may be later-stage.</li>
        <li><Bullet />Check the Exits tab weekly. Any name you own that appears there with a COLLAPSE badge warrants a review — it's the smart money leaving.</li>
      </ul>
    ),
    insight: (
      <p>Cross-reference the Leaders list with the Setup Filter output. Names appearing in <em>both</em> — high Flow Score AND passing all 4 filter layers — are the highest-conviction trade candidates. The overlap is your shortlist.</p>
    ),
  },
  {
    id: "flow-map",
    label: "Flow Map",
    group: "discover",
    icon: Map,
    href: "/flow-map",
    tagline: "The full institutional capital map — asset classes, COT, sector rotation, and international flows.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet /><strong>Market Summary:</strong> aggregate flow gauge (BULLISH / NEUTRAL / BEARISH) + sector breadth stats.</li>
        <li><Bullet /><strong>Asset Class Flows:</strong> weekly and daily dollar flows into Equities, Bonds, Gold, and Cash. Shows which major asset is receiving vs losing capital.</li>
        <li><Bullet /><strong>COT Positioning:</strong> Commitment of Traders data grouped by Commodities, Equities/Volatility, Rates/Currency, and Crypto. Net positioning percentile.</li>
        <li><Bullet /><strong>Convergence Table:</strong> ETF flow + COT alignment. BULLISH = both confirm accumulation. DIVERGENT = conflicting signals — treat with caution.</li>
        <li><Bullet /><strong>Sector Rankings:</strong> all 11 sectors ranked by composite score with trajectory sparklines and dollar flow amounts.</li>
        <li><Bullet /><strong>Rotation Map:</strong> scatter plot of sectors by momentum (x-axis) vs relative strength (y-axis). Four quadrants: Leading, Improving, Weakening, Lagging.</li>
        <li><Bullet /><strong>Industry Flows + International Flows:</strong> sub-sector and regional breakdowns.</li>
        <li><Bullet /><strong>Intermarket Context:</strong> Gold, Long Bonds, and USD vs SPY — the risk signal (RISK ON / RISK OFF / NEUTRAL) from intermarket relationships.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Start with the Intermarket risk signal — if it's RISK OFF (bonds up, gold up, USD up vs stocks), de-risk before reading anything else.</li>
        <li><Bullet />Asset Class Flows tell you the macro rotation: if bond inflows &gt; equity inflows, institutions are defensively positioned regardless of what individual charts show.</li>
        <li><Bullet />The Rotation Map is the best single chart for sector timing: names moving from Improving → Leading quadrant are accelerating into leadership. Buy sectors in the transition zone.</li>
        <li><Bullet />Use Convergence to validate sector thesis: BULLISH convergence (ETF flow + COT both positive) is institutional conviction. DIVERGENT = wait.</li>
      </ul>
    ),
    insight: (
      <p>The Rotation Map quadrant transition is where the money is made. A sector moving from bottom-right (Improving) to top-right (Leading) is the early institutional accumulation window. Sectors in the Leading quadrant that are decelerating (moving left) are past peak — trim, don't add.</p>
    ),
  },
  {
    id: "filter",
    label: "Setup Filter",
    group: "discover",
    icon: Filter,
    href: "/filter",
    tagline: "The 4-layer pre-trade gate — every result is in the right sector, in an uptrend, leading peers, and moving now.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Four sequential filters eliminate the ~3,500-stock universe down to a ranked shortlist:</li>
        <li className="pl-4"><Bullet2 /><strong>Layer 1 — Flow:</strong> only sectors with institutional inflow pass.</li>
        <li className="pl-4"><Bullet2 /><strong>Layer 2 — Trend:</strong> SMA200 must be rising and price above it.</li>
        <li className="pl-4"><Bullet2 /><strong>Layer 3 — RS:</strong> stock must outperform both SPY and its sector ETF on relative strength.</li>
        <li className="pl-4"><Bullet2 /><strong>Layer 4 — Momentum:</strong> RSI ≥ 40 hard filter + momentum score (near 20d high, consolidation break, volume expansion).</li>
        <li><Bullet />Funnel strip shows the pass count at each layer so you can see where the universe is tightest.</li>
        <li><Bullet />Sector context pills show all 11 sectors sorted by composite score with WoW change — click a pill to filter results to that sector.</li>
        <li><Bullet />Controls: Sector, Category, Min ADV, Top N, RS 52wk High toggle, Mom threshold (0 = Layer 4 disabled).</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Set Mom threshold to <strong>15</strong> (default) — this requires at least being near the 20-day high. Raise to 25–30 for higher-conviction momentum signals only.</li>
        <li><Bullet />Set Mom threshold to <strong>0</strong> to see the full RS-ranked universe (pure Layer 3 output) — useful for identifying watchlist names not yet in momentum.</li>
        <li><Bullet />Filter to a single sector after identifying it as leading on the Sectors page or Flow Map.</li>
        <li><Bullet />Sort by RS to find the relative strength leaders. Sort by Momentum to find names with the most active tape.</li>
        <li><Bullet />Enable RS 52wk High filter for the tightest, highest-conviction list — only names where the RS Line itself is at a new annual high.</li>
      </ul>
    ),
    insight: (
      <p>The default output (Mom ≥ 15) is your daily trade candidate list. Rank 1–10 are the names with the strongest relative strength inside the best sectors with active momentum. These are the setups you chart, not the entire screener universe.</p>
    ),
  },
  {
    id: "internals",
    label: "Market Internals",
    group: "discover",
    icon: Activity,
    href: "/internals",
    tagline: "Breadth data — how many stocks are actually participating in the move.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />% of S&P 500 stocks above their 200d and 50d SMAs — participation breadth.</li>
        <li><Bullet />Advance/Decline ratio and cumulative A/D line — net buying vs selling across the market.</li>
        <li><Bullet />New 20-day highs vs lows — momentum breadth at the individual stock level.</li>
        <li><Bullet />Highs/Lows ratio: above 1.0 = more stocks making new highs than lows (bull condition).</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />When SPY is rising but % above 50d SMA is falling: narrowing market — the index is being carried by a few large caps. Reduce new entries.</li>
        <li><Bullet />New 20d Highs expanding alongside SPY highs = broad healthy rally. New 20d Lows expanding while SPY holds = underlying deterioration.</li>
        <li><Bullet />A/D ratio below 1.0 on an up day = distribution. More stocks are falling than rising beneath the surface.</li>
      </ul>
    ),
    insight: (
      <p>Breadth divergence (index up, A/D line down) historically precedes corrections by 2–6 weeks. If you see the index near all-time highs but Market Internals showing fewer than 50% of stocks above their 50d SMA, tighten stops and reduce new position size.</p>
    ),
  },
  {
    id: "economic",
    label: "Economic Data",
    group: "discover",
    icon: Calendar,
    href: "/economic",
    tagline: "Macro calendar and data releases — the scheduled events that move markets.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet /><strong>Calendar tab:</strong> upcoming economic releases for the week — CPI, FOMC, NFP, GDP, PMI. Impact rating (High/Medium/Low) and consensus estimates.</li>
        <li><Bullet /><strong>Data tab:</strong> actual vs forecast vs prior for recent releases. Color-coded: green = beat, red = miss.</li>
        <li><Bullet />Weekly navigation to look ahead or review recent weeks.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Check the Calendar at the start of each week. High-impact events (CPI, FOMC) are potential volatility catalysts — avoid entering new positions the day before.</li>
        <li><Bullet />After a data release, check the Data tab: consistent beats across CPI + NFP + GDP = reflationary environment, bullish for cyclicals. Misses = risk-off rotation.</li>
      </ul>
    ),
    insight: (
      <p>The calendar is a risk management tool, not a trading signal. Use it to avoid holding through binary events on new positions. If you're already in a position, know your stop before the number drops.</p>
    ),
  },
  {
    id: "recommendations",
    label: "Recommendations",
    group: "discover",
    icon: Target,
    href: "/recommendations",
    tagline: "Daily factor-scored buy signals with position tracking and conviction ratings.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Daily recommendations list: each entry includes ticker, entry price, conviction score, sector context, and AI rationale.</li>
        <li><Bullet />Open Positions table: tracks active trades with entry price, current stop, unrealised P&L, and portfolio weight.</li>
        <li><Bullet />Regime indicator at the top of the page gates the full recommendation engine — no new longs in <Tag red>RISK OFF</Tag>.</li>
        <li><Bullet />Sector rankings sidebar: shows which sectors are producing the most recommendations and their rotation score.</li>
        <li><Bullet />History tab: scroll back through prior days' recommendations to see what was suggested and how it performed.</li>
        <li><Bullet />Pending Breakouts section: setups that are close to trigger but haven't activated yet — watchlist for the next session.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Read the regime and the sector rankings first — they tell you the context the recommendations are generated in.</li>
        <li><Bullet />Sort by conviction score. Focus on the top 3–5 names, not the full list.</li>
        <li><Bullet />Use the Pending Breakouts section as your pre-market prep — these are the setups most likely to activate during the session.</li>
        <li><Bullet />Add positions via the Open Positions table (+ button) to track your actual entries against the system's suggested levels.</li>
      </ul>
    ),
    insight: (
      <p>The recommendation engine runs after 6 PM ET once the day's data is downloaded. Morning sessions show the prior day's output. The conviction score already incorporates flow, trend, RS, and momentum — a score above 75 means all four sub-systems are aligned. Below 60 = one or more systems are disagreeing.</p>
    ),
  },
  {
    id: "strategy",
    label: "Strategy",
    group: "discover",
    icon: Swords,
    href: "/strategy",
    tagline: "All-weather playbook — market regime, long/short allocations, and hedge positioning.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Market regime label: BULL, BULL VOLATILE, CORRECTION, BEAR, RECOVERY — with breadth metrics (% above 200d, A/D ratio, H/L ratio).</li>
        <li><Bullet />Long allocation: suggested % of capital to deploy in equities given the regime.</li>
        <li><Bullet />Short candidates: stocks flagged for institutional selling, categorised as STRONG SHORT, SHORT, or SPECULATIVE SHORT.</li>
        <li><Bullet />Hedge instruments: grouped by tier — Index Futures, Inverse ETFs, Safe Havens. Each with entry rationale.</li>
        <li><Bullet />Intermarket signals panel: Gold, TLT, USD vs SPY positioning.</li>
        <li><Bullet />BR (Bull/Bear) and intermarket signals sub-sections for further confirmation.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />The regime label is the master context. Use it to set portfolio heat: BULL = max long allocation. CORRECTION = reduce longs, add hedges. BEAR = hedges dominant, minimal longs.</li>
        <li><Bullet />Check the Short candidates list before looking at new long entries. If a name you're watching appears on the shorts list, that's a red flag — the system sees institutional selling.</li>
        <li><Bullet />Use the Hedge instruments list as a menu: in CORRECTION mode, add one Tier 1 hedge (inverse ETF) as portfolio insurance.</li>
      </ul>
    ),
    insight: (
      <p>The strategy page is the risk framework. The recommendations page is the trade list. Use Strategy to determine <em>how much</em> to risk, then Recommendations to decide <em>what</em> to buy. Never run the trade list without checking the regime first.</p>
    ),
  },
  {
    id: "futures",
    label: "Futures",
    group: "discover",
    icon: Gauge,
    href: "/futures",
    tagline: "CTA positioning in ES, NQ, Gold, and Silver — what the trend-followers are doing.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Four futures instruments: ES (S&P), NQ (Nasdaq), GC (Gold), SI (Silver).</li>
        <li><Bullet />Each card shows CTA net position (long/short/neutral), trend direction, and position change WoW.</li>
        <li><Bullet />CTA bias badge per instrument: the algorithmic trend-following community's current stance.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />CTAs are momentum-driven and systematic — their positioning amplifies existing trends. If CTAs are max-long ES, they'll provide a tailwind to the uptrend. If they flip to short, they'll accelerate the downside.</li>
        <li><Bullet />Watch for CTA flip events: when CTAs cross from net long to net short (or vice versa), it often marks a near-term volatility spike as they unwind and rebuild positions.</li>
      </ul>
    ),
    insight: (
      <p>CTAs don't lead markets — they follow and amplify. A CTA long position that's already weeks old in ES is less informative than a <em>new</em> CTA long (WoW change turned positive). The direction of change matters more than the level.</p>
    ),
  },
  {
    id: "collar",
    label: "JPM Collar",
    group: "discover",
    icon: Shield,
    href: "/collar",
    tagline: "JPMorgan's quarterly SPY collar trade — tracks the active collar and its price boundaries.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Active fund ticker (e.g. JHEQX), current collar strike levels, and days until quarterly reset.</li>
        <li><Bullet />Price position within the collar: how far current SPY price is from the floor (put) and ceiling (call).</li>
        <li><Bullet />Sister funds table: JPM's full suite of collar products and their respective strike windows.</li>
        <li><Bullet />Contextual explanation of how the collar mechanics work.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />The put strike is a potential support level — large institutional hedging flows concentrate near it. If SPY is approaching the put floor, expect buying pressure from delta-hedging.</li>
        <li><Bullet />The call strike is a ceiling — JPM sells calls at this level every quarter, creating a supply overhang. Moves above it face selling pressure.</li>
        <li><Bullet />The reset date is a volatility event: as the old collar expires and a new one is written, the window around expiry often sees increased vol.</li>
      </ul>
    ),
    insight: (
      <p>The collar doesn't predict direction — it maps the gravitational zones around SPY. Use the floor and ceiling as context for stops and targets on index-correlated trades, not as buy/sell signals by themselves.</p>
    ),
  },
  {
    id: "cta",
    label: "CTA Positioning",
    group: "discover",
    icon: TrendingDown,
    href: "/cta",
    tagline: "Systematic trend-follower positioning across asset classes — the CTA footprint in detail.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Aggregate bias panel: net CTA position across equities, bonds, commodities, and FX.</li>
        <li><Bullet />Instrument-level table: individual futures contracts with CTA net position, direction, and WoW change.</li>
        <li><Bullet />Bias labels per instrument: LONG, SHORT, NEUTRAL with positioning percentile context.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Use the aggregate bias panel first — if CTAs are net short across equities AND bonds, it's a crowded defensive positioning. These tend to unwind violently when macro surprises positive.</li>
        <li><Bullet />Individual instrument table: look for instruments where CTAs are near extreme long or short positioning (top/bottom 10th percentile). These are potential mean-reversion setups when the trend exhausts.</li>
      </ul>
    ),
    insight: (
      <p>CTA positioning is a sentiment and flow lens, not a timing signal. Extreme CTA short positions in equities create a short-squeeze potential when news catalysts flip the tape. This is why bearish setups sometimes explode upward — the fuel is the unwind of crowded CTA shorts.</p>
    ),
  },
  {
    id: "uptrend",
    label: "Uptrend Analysis",
    group: "discover",
    icon: TrendingUp,
    href: "/uptrend",
    tagline: "Resistance levels and upside targets — where do stocks have room to run?",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Per-stock resistance levels: R1, R2, R3 computed from prior pivot highs, volume clusters, and ATH distance.</li>
        <li><Bullet />ATH status: whether the stock is at, near, or below all-time highs.</li>
        <li><Bullet />Upside report: AI-annotated resistance charts for each stock in the filtered universe.</li>
        <li><Bullet />Filter by sector, stage, or RS rank to focus the analysis.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Use before sizing a position: if R1 is 5% away but R3 is 25% away, there's good risk/reward. If R1 is 2% away in a tight range, the near-term upside is capped.</li>
        <li><Bullet />ATH stocks are the clearest setups — no overhead resistance from prior buyers. Once a stock makes a new ATH, resistance becomes projection-based.</li>
      </ul>
    ),
    insight: (
      <p>The best setups combine: <strong>Setup Filter rank 1–5</strong> + <strong>ATH status</strong> + <strong>R1 ≥ 8% away</strong>. This means you're buying the leading RS stock in a leading sector at a point where there's meaningful room to run before the next supply zone.</p>
    ),
  },

  // ── ANALYZE ───────────────────────────────────────────────────────────────
  {
    id: "charts",
    label: "Charts",
    group: "analyze",
    icon: BarChart2,
    href: "/charts",
    tagline: "Chart Studio — technical charts with AI analysis and earnings overlays.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Search any ticker to load its technical chart: price, volume, SMA200/50, signals overlay.</li>
        <li><Bullet />AI Analysis tab: LLM-generated visual audit (trend structure, key levels, OBV, CCI) and a buy/hold/avoid verdict with confidence score.</li>
        <li><Bullet />Quick-access bar: recently viewed and favorited tickers for fast navigation.</li>
        <li><Bullet />Base64-encoded chart from the backend — the same chart the screener uses internally.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Use after the Setup Filter identifies a candidate — load the chart to visually confirm the setup before placing a trade.</li>
        <li><Bullet />Read the AI verdict: STRONG BUY / BUY / HOLD / AVOID. Confidence ≥ 80 means the visual evidence is unambiguous. Below 60 = conflicting signals on the chart.</li>
        <li><Bullet />Check the OBV analysis in the AI audit — divergence between OBV and price (OBV declining while price rises) is a distribution warning.</li>
      </ul>
    ),
    insight: (
      <p>The Chart Studio is the final confirmation step before entry — not a discovery tool. Use the filter pipeline to find the name first, then use Charts to validate that the visual setup matches the quantitative signals. If the chart looks wrong despite good scores, trust the chart.</p>
    ),
  },
  {
    id: "ticker",
    label: "Ticker Lookup",
    group: "analyze",
    icon: Search,
    href: "/ticker",
    tagline: "Full ticker deep-dive — screener data, chart, news, earnings, resistance, and Alpha Lens AI chat.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />Tabs: <strong>Overview</strong> (screener signals, stage, sector) · <strong>Chart</strong> · <strong>Analysis</strong> (AI audit) · <strong>Resistance</strong> (R1/R2/R3 chart) · <strong>News</strong> · <strong>Earnings</strong> (quarterly EPS/revenue history)</li>
        <li><Bullet />Alpha Lens: floating AI chat panel — ask questions about the stock, its chart, its sector, or macro context. The AI has full visibility into all the data shown on the page.</li>
        <li><Bullet />OHLCV history chart with period selector (3M, 6M, 1Y, 2Y).</li>
        <li><Bullet />Star button to add to Watchlist. Refreshes screener data on demand.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Start with the Overview tab to confirm stage and signals. Stage 2 with RS Leader signal = strongest setup.</li>
        <li><Bullet />Go to Resistance tab to see R1/R2/R3 levels — use these to set profit targets.</li>
        <li><Bullet />Use the Earnings tab to check if the next earnings date is close. Avoid initiating positions within 2 weeks of earnings unless you have conviction on the number.</li>
        <li><Bullet />Open Alpha Lens and ask: <em>"Is this a good entry here? What's the risk to the downside?"</em> — it will reason through the chart, signals, and resistance levels together.</li>
      </ul>
    ),
    insight: (
      <p>Ticker Lookup is where you do the pre-trade due diligence. Minimum checklist before entry: Stage 2 ✓, RS Leader ✓, Resistance R1 ≥ 5% away ✓, No earnings in next 10 days ✓, Alpha Lens gives BUY or STRONG BUY ✓.</p>
    ),
  },

  // ── MANAGE ────────────────────────────────────────────────────────────────
  {
    id: "settings",
    label: "Settings",
    group: "manage",
    icon: Settings,
    href: "/settings",
    tagline: "Configure API connection, LLM key, and display preferences.",
    what: (
      <ul className="space-y-1.5">
        <li><Bullet />API Base URL: the Trading Engine backend address (default <code className="text-[10px] bg-[var(--border)] px-1 py-0.5 rounded">localhost:8000</code>).</li>
        <li><Bullet />LLM API Key: your OpenAI / Anthropic key for AI Analysis, Alpha Lens chat, and AI market reports.</li>
        <li><Bullet />Results per page, default refresh toggle, active session selector.</li>
        <li><Bullet />Theme toggle: Light / Dark / System.</li>
      </ul>
    ),
    how: (
      <ul className="space-y-1.5">
        <li><Bullet />Set the API URL first — without it, every page will show errors. For cloud deployments, replace localhost with your server address.</li>
        <li><Bullet />The LLM key is required for AI Analysis tabs and Alpha Lens. Without it, charts and screener data still work — only AI features are disabled.</li>
      </ul>
    ),
    insight: (
      <p>Settings are persisted in localStorage — they survive page refreshes but are browser-specific. If you access AlphaStream from multiple devices, set the API URL and LLM key on each one.</p>
    ),
  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Bullet() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 mr-2 mt-[5px] shrink-0 align-top" />;
}

function Bullet2() {
  return <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)]/50 mr-2 mt-[6px] shrink-0 align-top" />;
}

function Tag({
  children,
  green,
  red,
  amber,
  blue,
  muted,
}: {
  children: React.ReactNode;
  green?: boolean;
  red?: boolean;
  amber?: boolean;
  blue?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mx-0.5",
        green && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        red && "bg-red-500/15 text-red-400 border-red-500/30",
        amber && "bg-amber-500/15 text-amber-400 border-amber-500/30",
        blue && "bg-blue-500/15 text-blue-400 border-blue-500/30",
        muted && "bg-[var(--border)] text-[var(--text-muted)] border-[var(--border)]"
      )}
    >
      {children}
    </span>
  );
}

const GROUP_STYLE = {
  discover: {
    label: "DISCOVER",
    dot: "bg-[var(--accent)]",
    header: "text-[var(--accent)]",
    divider: "border-[var(--accent)]/20",
  },
  analyze: {
    label: "ANALYZE",
    dot: "bg-purple-400",
    header: "text-purple-400",
    divider: "border-purple-400/20",
  },
  manage: {
    label: "MANAGE",
    dot: "bg-[var(--text-muted)]",
    header: "text-[var(--text-muted)]",
    divider: "border-[var(--border)]",
  },
};

// ─── TOC ──────────────────────────────────────────────────────────────────────

function TableOfContents({ active }: { active: string }) {
  const groups = ["discover", "analyze", "manage"] as const;

  return (
    <nav className="space-y-4">
      {groups.map((g) => {
        const style = GROUP_STYLE[g];
        const items = SECTIONS.filter((s) => s.group === g);
        return (
          <div key={g}>
            <p className={cn("text-[10px] font-bold tracking-wider uppercase mb-1", style.header)}>
              {style.label}
            </p>
            {items.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors",
                  active === s.id
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <s.icon className="h-3 w-3 shrink-0" />
                {s.label}
              </a>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ s }: { s: GuideSection }) {
  const style = GROUP_STYLE[s.group];
  const Icon = s.icon;

  return (
    <div
      id={s.id}
      className="scroll-mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
    >
      {/* Header */}
      <div className={cn("flex items-start gap-3 px-5 py-4 border-b", style.divider)}>
        <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] shrink-0">
          <Icon className="h-4 w-4 text-[var(--text-primary)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{s.label}</h2>
            <a
              href={s.href}
              className="flex items-center gap-0.5 text-[10px] text-[var(--accent)] hover:underline"
            >
              {s.href} <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.tagline}</p>
        </div>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
        {/* What */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            <Eye className="h-3 w-3" /> What you see
          </p>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed space-y-1">{s.what}</div>
        </div>

        {/* How */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            <BookOpen className="h-3 w-3" /> How to use it
          </p>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed space-y-1">{s.how}</div>
        </div>

        {/* Insight */}
        <div className="px-5 py-4 bg-[var(--accent)]/[0.03]">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]/70 mb-3">
            <Lightbulb className="h-3 w-3" /> Actionable insight
          </p>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed">{s.insight}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex gap-6 items-start">
      {/* Sticky ToC */}
      <aside className="hidden xl:block w-44 shrink-0 sticky top-4">
        <TableOfContents active={activeId} />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">User Guide</h1>
            <p className="text-sm text-[var(--text-muted)]">How to read AlphaStream and turn it into trades</p>
          </div>
        </div>

        {/* Workflow callout */}
        <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-5 py-4">
          <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">Recommended daily workflow</p>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-primary)]">
            {[
              ["Overview", "regime check"],
              ["Global Markets", "macro backdrop"],
              ["Flow Map", "rotation + risk signal"],
              ["Sectors", "identify leading sectors"],
              ["Setup Filter", "ranked shortlist"],
              ["Ticker Lookup", "due diligence"],
              ["Recommendations", "final entries"],
            ].map(([name, desc], i, arr) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="font-medium">{name}</span>
                <span className="text-[var(--text-muted)] text-xs">({desc})</span>
                {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
              </span>
            ))}
          </div>
        </div>

        {/* Section cards */}
        {SECTIONS.map((s) => (
          <SectionCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
