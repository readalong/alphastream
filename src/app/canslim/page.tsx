"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crosshair, Eye, RefreshCw, AlertTriangle, Search,
  Download, TrendingUp, ChevronUp, ChevronDown, Info,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBreakouts, useActions, useNarrative, useCanslim, useBreakoutChart } from "@/hooks/use-canslim";
import { GradeBadge, GRADE_STYLE } from "@/components/canslim/grade-badge";
import { PatternBadge } from "@/components/canslim/pattern-badge";
import { ActionBadge, ConvictionBar } from "@/components/canslim/action-badge";
import { NarrativePanel } from "@/components/canslim/narrative-panel";
import { BreakoutChartModal } from "@/components/canslim/breakout-chart-modal";
import { CanslimScorecardCard } from "@/components/canslim/canslim-scorecard";
import { cn } from "@/lib/utils";
import { SECTOR_ETF_NAMES } from "@/lib/constants";
import type { BreakoutEntry, ActionItem, PatternType, PatternStage, ActionType } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

type PageTab = "actions" | "breakouts" | "ticker";

const ACTION_OPTIONS: { label: string; value: ActionType }[] = [
  { label: "All",       value: "BUY" },       // "All" uses empty filter
  { label: "BUY",       value: "BUY"       },
  { label: "ALERT",     value: "ALERT"     },
  { label: "WATCHLIST", value: "WATCHLIST" },
];

const SCORE_OPTIONS = [
  { label: "1+", value: 1 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
  { label: "5+", value: 5 },
  { label: "6+", value: 6 },
];

const CONVICTION_OPTIONS = [
  { label: "Any", value: 0  },
  { label: "40+", value: 40 },
  { label: "60+", value: 60 },
  { label: "75+", value: 75 },
];

const STAGE_OPTIONS: { label: string; value: PatternStage }[] = [
  { label: "Forming",      value: "FORMING"       },
  { label: "Cup Complete", value: "CUP_COMPLETE"  },
  { label: "Handle",       value: "HANDLE"        },
  { label: "Breakout",     value: "BREAKOUT"      },
  { label: "Extended",     value: "EXTENDED"      },
];

const PATTERN_OPTIONS: { label: string; value: PatternType }[] = [
  { label: "Cup & Handle",   value: "CUP_AND_HANDLE"  },
  { label: "Flat Base",      value: "FLAT_BASE"        },
  { label: "Double Bottom",  value: "DOUBLE_BOTTOM"    },
  { label: "Saucer",         value: "SAUCER"           },
  { label: "High Tight Flag",value: "HIGH_TIGHT_FLAG"  },
];

const PATTERN_NAMES: Partial<Record<PatternType, string>> = {
  CUP_AND_HANDLE:  "Cup & Handle",
  FLAT_BASE:       "Flat Base",
  DOUBLE_BOTTOM:   "Double Bottom",
  SAUCER:          "Saucer",
  HIGH_TIGHT_FLAG: "High Tight Flag",
};

const STAGE_COLORS: Partial<Record<PatternStage, string>> = {
  FORMING:      "text-[#374151]  bg-[#374151]/20  border-[#374151]",
  CUP_COMPLETE: "text-[#f59e0b]  bg-[#f59e0b]/10  border-[#f59e0b]/30",
  HANDLE:       "text-[#00b4d8]  bg-[#00b4d8]/10  border-[#00b4d8]/30",
  BREAKOUT:     "text-[#39d353]  bg-[#39d353]/10  border-[#39d353]/30",
  EXTENDED:     "text-[#f59e0b]  bg-[#f59e0b]/10  border-[#f59e0b]/30",
};

const REGIME_STYLE: Record<string, string> = {
  GREEN:  "bg-[#0d2818] text-[#39d353] border-[#39d353]/50",
  YELLOW: "bg-[#1a1a00] text-[#f59e0b] border-[#f59e0b]/50",
  RED:    "bg-[#1a0808] text-[#ff4d6d] border-[#ff4d6d]/50",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStale(asOfDate: string | undefined): boolean {
  if (!asOfDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return asOfDate < today;
}

function fmtPct(n: number, plus = false): string {
  return `${plus && n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function pctColor(pct: number): string {
  if (pct > 5) return "text-orange-400";
  if (pct > 2) return "text-amber-400";
  return "text-[#39d353]";
}

/** Convert ActionItem → minimal BreakoutEntry for the chart modal */
function actionToBreakoutEntry(item: ActionItem): BreakoutEntry {
  return {
    ticker: item.ticker,
    canslim_score: item.canslim_score,
    canslim_grade: item.canslim_grade,
    pattern: item.pattern ?? "NONE",
    stage: item.stage ?? "FORMING",
    pivot: item.pivot,
    stop_loss: item.stop,
    pct_above_pivot: item.pct_above_pivot,
    eps_growth_yoy: item.eps_growth_yoy,
    rs_percentile: item.rs_percentile,
    extended: item.extended,
    close_price: item.close_price,
    confidence: item.conviction / 100,
    data_quality: item.data_quality,
  };
}

// ─── Chip toggle helper ────────────────────────────────────────────────────────

function toggleValue<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

// ─── RegimeBadge ──────────────────────────────────────────────────────────────

function RegimeBadge({ regime }: { regime: string }) {
  const cls = REGIME_STYLE[regime] ?? "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)]";
  return (
    <span className={cn("px-2 py-0.5 rounded border text-xs font-semibold tracking-wider", cls)}>
      {regime}
    </span>
  );
}

// ─── StageChip ────────────────────────────────────────────────────────────────

function StageChip({ stage, extended }: { stage: PatternStage; extended?: boolean }) {
  const cls = STAGE_COLORS[stage] ?? "text-[var(--text-muted)] bg-[var(--bg-primary)] border-[var(--border)]";
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium", cls)}>
      {extended && stage !== "EXTENDED" && <AlertTriangle className="h-2.5 w-2.5" />}
      {stage.replace("_", " ")}
    </span>
  );
}

// ─── ActionCard ───────────────────────────────────────────────────────────────

function ActionCard({
  item,
  onChart,
  onFullAnalysis,
}: {
  item: ActionItem;
  onChart: () => void;
  onFullAnalysis: () => void;
}) {
  const stopPct = item.entry && item.stop
    ? ((item.stop - item.entry) / item.entry) * 100 : null;
  const targetPct = item.entry && item.target
    ? ((item.target - item.entry) / item.entry) * 100 : null;

  const borderColor =
    item.action === "BUY"       ? "border-l-[#39d353]" :
    item.action === "ALERT"     ? "border-l-[#f59e0b]" :
    item.action === "WATCHLIST" ? "border-l-[#374151]" :
    item.action === "NO_BUY"    ? "border-l-[#ff4d6d]" :
    "border-l-[var(--border)]";

  return (
    <div className={cn(
      "relative rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-3 border-l-4",
      borderColor,
      item.extended && "border-t border-t-amber-500/30",
    )}>
      {/* Extended badge */}
      {item.extended && (
        <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400">
          <AlertTriangle className="h-2.5 w-2.5" /> EXTENDED
        </span>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActionBadge action={item.action} size="sm" />
          <Link
            href={`/ticker/${item.ticker}`}
            className="font-mono text-base font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            {item.ticker}
          </Link>
        </div>
        <GradeBadge score={item.canslim_score} grade={item.canslim_grade} size="sm" />
      </div>

      {/* Conviction bar */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Conviction</p>
        <ConvictionBar value={item.conviction} />
      </div>

      {/* Pattern + stage */}
      {item.pattern && item.pattern !== "NONE" && item.pattern !== "INSUFFICIENT_DATA" && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <PatternBadge pattern={item.pattern} stage={item.stage ?? "FORMING"} size="sm" />
        </div>
      )}

      {/* Entry / stop / target */}
      {(item.entry != null || item.stop != null || item.target != null) && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          {item.entry != null && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Entry</p>
              <p className={cn("font-mono font-semibold", item.extended ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
                ${item.entry.toFixed(2)}
              </p>
            </div>
          )}
          {item.stop != null && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Stop</p>
              <p className="font-mono font-semibold text-[#ff4d6d]">
                ${item.stop.toFixed(2)}
                {stopPct != null && (
                  <span className="text-[var(--text-muted)] font-normal ml-1">({stopPct.toFixed(1)}%)</span>
                )}
              </p>
            </div>
          )}
          {item.target != null && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Target</p>
              <p className="font-mono font-semibold text-[#39d353]">
                ${item.target.toFixed(2)}
                {targetPct != null && (
                  <span className="text-[var(--text-muted)] font-normal ml-1">(+{targetPct.toFixed(1)}%)</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fundamentals row */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
        {item.eps_growth_yoy != null && (
          <span className={item.eps_growth_yoy >= 25 ? "text-[#39d353]" : ""}>
            EPS {item.eps_growth_yoy >= 0 ? "+" : ""}{item.eps_growth_yoy.toFixed(0)}% YoY
          </span>
        )}
        {item.rs_percentile != null && <span>RS pct {item.rs_percentile}</span>}
        {item.sector_tier && (
          <span className={item.sector_tier === "LEADING" ? "text-[#39d353]" : ""}>
            {item.sector_tier}
          </span>
        )}
        {item.sector_flow && <span>{item.sector_flow}</span>}
      </div>

      {/* Action reason */}
      {item.action_reason && (
        <p className="text-[10px] text-[var(--text-muted)] leading-snug line-clamp-2">
          {item.action_reason}
        </p>
      )}

      {/* Footer actions */}
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button
          onClick={onChart}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View Chart
        </button>
        <button
          onClick={onFullAnalysis}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Full Analysis
        </button>
      </div>
    </div>
  );
}

// ─── BreakoutRow (enhanced) ────────────────────────────────────────────────────

function BreakoutRow({ entry, onView }: { entry: BreakoutEntry; onView: () => void }) {
  const gs = GRADE_STYLE[entry.canslim_grade];
  const stageStyle = STAGE_COLORS[entry.stage] ?? "";

  return (
    <tr
      onClick={onView}
      className={cn(
        "border-t border-[var(--border)] cursor-pointer hover:bg-[var(--bg-card)] transition-colors",
        entry.extended && "bg-amber-500/5",
      )}
    >
      {/* Ticker */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/ticker/${entry.ticker}`}
            onClick={e => e.stopPropagation()}
            className="font-mono text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)]"
          >
            {entry.ticker}
          </Link>
          {entry.data_quality === "PROXY_ONLY" && (
            <span className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]">
              PROXY
            </span>
          )}
        </div>
      </td>

      {/* Score */}
      <td className="px-3 py-2.5">
        <GradeBadge score={entry.canslim_score} grade={entry.canslim_grade} />
      </td>

      {/* Pattern */}
      <td className="hidden sm:table-cell px-3 py-2.5">
        <PatternBadge pattern={entry.pattern} stage={entry.stage} />
      </td>

      {/* Stage */}
      <td className="hidden md:table-cell px-3 py-2.5">
        <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", stageStyle)}>
          {entry.extended && entry.stage !== "EXTENDED" ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              {entry.stage}
            </span>
          ) : entry.stage.replace("_", " ")}
        </span>
      </td>

      {/* Pivot */}
      <td className="hidden sm:table-cell px-3 py-2.5 font-mono text-xs text-[var(--text-primary)] tabular-nums text-right">
        {entry.pivot != null ? `$${entry.pivot.toFixed(2)}` : "—"}
      </td>

      {/* % Above pivot */}
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-right">
        {entry.pct_above_pivot != null ? (
          <span className={pctColor(entry.pct_above_pivot)}>
            {entry.pct_above_pivot > 5 && <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5" />}
            {fmtPct(entry.pct_above_pivot, true)}
          </span>
        ) : <span className="text-[var(--text-muted)]">—</span>}
      </td>

      {/* Stop */}
      <td className="hidden md:table-cell px-3 py-2.5 font-mono text-xs text-[#ff4d6d] tabular-nums text-right">
        {entry.stop_loss != null ? `$${entry.stop_loss.toFixed(2)}` : "—"}
      </td>

      {/* EPS YoY */}
      <td className="hidden lg:table-cell px-3 py-2.5 font-mono text-xs tabular-nums text-right">
        {entry.eps_growth_yoy != null ? (
          <span className={entry.eps_growth_yoy >= 25 ? "text-[#39d353]" : "text-[var(--text-muted)]"}>
            {entry.eps_growth_yoy >= 0 ? "+" : ""}{entry.eps_growth_yoy.toFixed(0)}%
          </span>
        ) : <span className="text-[var(--text-muted)]">—</span>}
      </td>

      {/* RS */}
      <td className="hidden lg:table-cell px-3 py-2.5 font-mono text-xs text-[var(--text-muted)] tabular-nums text-right">
        {entry.rs_percentile != null ? `${entry.rs_percentile}${entry.rs_52w_high ? " ★" : ""}` : "—"}
      </td>

      {/* Sector ETF */}
      <td className="hidden xl:table-cell px-3 py-2.5 text-xs text-[var(--text-muted)]">
        {entry.sector_etf ?? "—"}
      </td>

      {/* Data quality */}
      <td className="hidden lg:table-cell px-3 py-2.5">
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 rounded border",
          entry.data_quality === "FULL"    ? "text-[#39d353] border-[#39d353]/30 bg-[#39d353]/5" :
          entry.data_quality === "PARTIAL" ? "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/5" :
          "text-[var(--text-muted)] border-[var(--border)]"
        )}>
          {entry.data_quality === "PROXY_ONLY" ? "PROXY" : entry.data_quality}
        </span>
      </td>

      {/* Eye */}
      <td className="px-3 py-2.5">
        <button
          onClick={e => { e.stopPropagation(); onView(); }}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          title="View chart"
        >
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── NoData empty state ────────────────────────────────────────────────────────

function NoDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Crosshair className="h-10 w-10 text-[var(--text-muted)]/30" />
      <div className="text-center">
        <p className="text-[var(--text-primary)] font-medium mb-1">No CAN SLIM data available</p>
        <p className="text-sm text-[var(--text-muted)] mb-3">Run the scanner to generate today's results:</p>
        <code className="text-xs px-3 py-1.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-mono">
          python main.py --canslim
        </code>
      </div>
    </div>
  );
}

// ─── ChartPanel (for Search Ticker tab) ──────────────────────────────────────

function ChartPanel({ ticker }: { ticker: string }) {
  const [timeframe, setTimeframe] = useState<"weekly" | "daily">("weekly");
  const [bars, setBars] = useState<65 | 130 | 260>(65);

  const { data, isLoading, error, refetch } = useBreakoutChart(ticker, timeframe, bars, true);

  const downloadUrl = `/api/trading/canslim/breakouts/${ticker}/chart?format=png&timeframe=${timeframe}&bars=${bars}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
          Annotated Chart
        </p>
        <div className="flex items-center gap-2">
          {/* Timeframe */}
          <div className="flex gap-0.5 p-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">
            {(["weekly", "daily"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2.5 py-0.5 rounded text-xs font-medium transition-colors capitalize",
                  timeframe === tf ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          {/* Bars */}
          <div className="flex gap-0.5 p-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)]">
            {([65, 130, 260] as const).map(b => (
              <button
                key={b}
                onClick={() => setBars(b)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                  bars === b ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {b}
              </button>
            ))}
          </div>
          {/* Download */}
          <a
            href={downloadUrl}
            download={`${ticker}-${timeframe}-${bars}.png`}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Download className="h-3 w-3" /> PNG
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] animate-pulse flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-[var(--text-muted)]/40 animate-spin" />
        </div>
      ) : error ? (
        <div className="aspect-[16/9] rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-[var(--text-muted)]">Chart unavailable</p>
          <button onClick={() => refetch()} className="text-xs text-[var(--accent)] hover:underline">
            Retry
          </button>
        </div>
      ) : data?.chart_b64 ? (
        <img
          src={`data:image/png;base64,${data.chart_b64}`}
          alt={`${ticker} O'Neil ${timeframe} chart`}
          className="w-full rounded-lg border border-[var(--border)]"
        />
      ) : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CANSLIMPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Tab state from URL
  const tab = (searchParams.get("tab") ?? "actions") as PageTab;
  const initialTicker = searchParams.get("t") ?? "";

  function setTab(t: PageTab) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", t);
    router.replace(`/canslim?${p.toString()}`);
  }

  // ── Actions tab state ──
  const [actionFilter, setActionFilter] = useState<ActionType[]>([]);
  const [actionsMinScore, setActionsMinScore] = useState(1);
  const [minConviction, setMinConviction] = useState(0);

  const { data: actionsData, isLoading: actionsLoading, error: actionsError, refetch: refetchActions } =
    useActions(
      { action: actionFilter.length ? actionFilter : undefined, min_score: actionsMinScore, min_conviction: minConviction },
      tab === "actions"
    );

  const { data: narrativeData, isLoading: narrativeLoading, error: narrativeError, refetch: refetchNarrative, isFetching: narrativeFetching } =
    useNarrative(tab === "actions");

  // ── Breakouts tab state ──
  const [minScore,  setMinScore]  = useState(5);
  const [stages,    setStages]    = useState<PatternStage[]>(["HANDLE", "BREAKOUT"]);
  const [patterns,  setPatterns]  = useState<PatternType[]>([]);
  const [sector,    setSector]    = useState("");
  const [sortCol,   setSortCol]   = useState<string>("canslim_score");
  const [sortAsc,   setSortAsc]   = useState(false);

  const { data: breakoutsData, isLoading: breakoutsLoading, error: breakoutsError, refetch: refetchBreakouts } =
    useBreakouts(
      { min_score: minScore, stage: stages.length ? stages : undefined, pattern: patterns.length ? patterns : undefined, sector: sector || undefined },
      tab === "breakouts"
    );

  // ── Search Ticker tab state ──
  const [tickerInput,    setTickerInput]    = useState(initialTicker);
  const [searchedTicker, setSearchedTicker] = useState(initialTicker.toUpperCase());

  const { data: canslimData, isLoading: canslimLoading, error: canslimError } =
    useCanslim(searchedTicker, tab === "ticker" && !!searchedTicker);

  // ── Chart modal (shared by Actions + Breakouts tabs) ──
  const [chartTicker, setChartTicker] = useState<string | null>(null);
  const [chartEntry,  setChartEntry]  = useState<BreakoutEntry | null>(null);

  function openChartForBreakout(entry: BreakoutEntry) {
    setChartTicker(entry.ticker);
    setChartEntry(entry);
  }
  function openChartForAction(item: ActionItem) {
    setChartTicker(item.ticker);
    setChartEntry(actionToBreakoutEntry(item));
  }

  // ── Refresh all ──
  function refreshAll() {
    if (tab === "actions")   { refetchActions(); refetchNarrative(); }
    if (tab === "breakouts") refetchBreakouts();
  }

  // ── Derived values for header ──
  const asOfDate =
    (tab === "actions"   ? actionsData?.as_of_date   : undefined) ??
    (tab === "breakouts" ? breakoutsData?.as_of_date : undefined) ??
    actionsData?.as_of_date ?? breakoutsData?.as_of_date;
  const regime =
    (tab === "actions"   ? actionsData?.market_regime   : undefined) ??
    (tab === "breakouts" ? breakoutsData?.market_regime : undefined) ??
    actionsData?.market_regime ?? breakoutsData?.market_regime;
  const totalScanned =
    actionsData?.total_scanned ?? breakoutsData?.total_scanned;
  const qualified =
    tab === "actions"   ? actionsData?.total :
    tab === "breakouts" ? breakoutsData?.total_qualified : undefined;
  const stale = isStale(asOfDate);
  const isRed = regime === "RED";

  // ── Sorted breakouts ──
  const sortedBreakouts = breakoutsData?.breakouts ? [...breakoutsData.breakouts].sort((a, b) => {
    let va: number | string = 0, vb: number | string = 0;
    if (sortCol === "canslim_score") { va = a.canslim_score; vb = b.canslim_score; }
    else if (sortCol === "pct_above_pivot") { va = a.pct_above_pivot ?? 999; vb = b.pct_above_pivot ?? 999; }
    else if (sortCol === "eps_growth_yoy") { va = a.eps_growth_yoy ?? -999; vb = b.eps_growth_yoy ?? -999; }
    else if (sortCol === "rs_percentile") { va = a.rs_percentile ?? 0; vb = b.rs_percentile ?? 0; }
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  }) : [];

  function toggleSort(col: string) {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(false); }
  }

  function SortHeader({ col, label, className }: { col: string; label: string; className?: string }) {
    const active = sortCol === col;
    return (
      <th
        className={cn("px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] select-none", className)}
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-0.5">
          {label}
          {active ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
        </span>
      </th>
    );
  }

  // ── Actions: group by action type ──
  const actionGroups: ActionType[] = ["BUY", "ALERT", "WATCHLIST"];
  const groupedActions = actionGroups.reduce((acc, act) => {
    acc[act] = (actionsData?.actions ?? []).filter(i => i.action === act);
    return acc;
  }, {} as Record<ActionType, ActionItem[]>);

  // ─── Render ───────────────────────────────────────────────────────────────

  // 404 = no data at all → full page empty state
  const is404 =
    (tab === "actions"   && actionsError   instanceof Error && actionsError.message.includes("404")) ||
    (tab === "breakouts" && breakoutsError instanceof Error && breakoutsError.message.includes("404"));

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-[var(--accent)] shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">CAN SLIM Scanner</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {regime && <RegimeBadge regime={regime} />}
              {asOfDate && <span className="text-xs text-[var(--text-muted)]">as of {asOfDate}</span>}
              {totalScanned != null && <span className="text-xs text-[var(--text-muted)]">Scanned {totalScanned.toLocaleString()}</span>}
              {qualified != null && <span className="text-xs text-[var(--text-muted)]">· {qualified} qualified</span>}
            </div>
          </div>
        </div>
        <button
          onClick={refreshAll}
          className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors shrink-0"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Stale data banner ── */}
      {stale && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">
            Data from {asOfDate} — run <code className="font-mono">--canslim</code> to refresh today's results
          </p>
        </div>
      )}

      {/* ── RED regime gate ── */}
      {isRed && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-[#ff4d6d]/30 bg-[#ff4d6d]/5">
          <AlertTriangle className="h-4 w-4 text-[#ff4d6d] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#ff4d6d]">Market Regime: RED — No new entries</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              M criterion fails in a downtrend. Use this list for watchlist planning only.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab strip ── */}
      <div className="flex gap-0 border-b border-[var(--border)]">
        {(["actions", "breakouts", "ticker"] as const).map(t => {
          const label = t === "actions" ? "Actions" : t === "breakouts" ? "Breakouts" : "Search Ticker";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: ACTIONS
      ══════════════════════════════════════════════════════ */}
      {tab === "actions" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Action filter */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <button
                onClick={() => setActionFilter([])}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  actionFilter.length === 0 ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                All
              </button>
              {(["BUY", "ALERT", "WATCHLIST"] as ActionType[]).map(act => (
                <button
                  key={act}
                  onClick={() =>
                    setActionFilter(prev =>
                      prev.includes(act) ? prev.filter(x => x !== act) : [...prev, act]
                    )
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    actionFilter.includes(act) ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {act}
                </button>
              ))}
            </div>

            {/* Min score */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)] self-center">Score</span>
              {SCORE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActionsMinScore(opt.value)}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    actionsMinScore === opt.value ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Min conviction */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)] self-center">Conv</span>
              {CONVICTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMinConviction(opt.value)}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    minConviction === opt.value ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <NarrativePanel
            data={narrativeData}
            isLoading={narrativeLoading}
            error={narrativeError}
            onRegenerate={() => refetchNarrative()}
            isRegenerating={narrativeFetching}
          />

          {/* Content */}
          {actionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />
              ))}
            </div>
          ) : is404 ? (
            <NoDataState />
          ) : actionsError ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-sm">
              Failed to load actions data.
            </div>
          ) : !actionsData?.actions.length ? (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)] text-sm">No candidates match the current filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {actionGroups.map(act => {
                const items = groupedActions[act] ?? [];
                if (!items.length) return null;
                return (
                  <div key={act}>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      {act} — {items.length} candidate{items.length !== 1 ? "s" : ""}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(item => (
                        <ActionCard
                          key={item.ticker}
                          item={item}
                          onChart={() => openChartForAction(item)}
                          onFullAnalysis={() => {
                            const p = new URLSearchParams({ tab: "ticker", t: item.ticker });
                            router.push(`/canslim?${p.toString()}`);
                            setSearchedTicker(item.ticker);
                            setTickerInput(item.ticker);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: BREAKOUTS
      ══════════════════════════════════════════════════════ */}
      {tab === "breakouts" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="space-y-2">
            {/* Pattern chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">Pattern</span>
              {PATTERN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPatterns(prev => toggleValue(prev, opt.value))}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    patterns.includes(opt.value)
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Stage chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">Stage</span>
              {STAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStages(prev => toggleValue(prev, opt.value))}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    stages.includes(opt.value)
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Score + Sector row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)] self-center">Score</span>
                {SCORE_OPTIONS.filter(o => o.value >= 4).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMinScore(opt.value)}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      minScore === opt.value ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">All Sectors</option>
                {Object.entries(SECTOR_ETF_NAMES).map(([etf, name]) => (
                  <option key={etf} value={etf}>{etf} — {name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {breakoutsLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-[var(--bg-card)] animate-pulse" />
              ))}
            </div>
          ) : is404 ? (
            <NoDataState />
          ) : breakoutsError ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-sm">
              Failed to load breakout data.
            </div>
          ) : !sortedBreakouts.length ? (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)] text-sm">No breakouts match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-card)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Ticker</th>
                    <SortHeader col="canslim_score" label="Score" />
                    <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Pattern</th>
                    <th className="hidden md:table-cell px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Stage</th>
                    <th className="hidden sm:table-cell px-3 py-2 text-right text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Pivot</th>
                    <SortHeader col="pct_above_pivot" label="% Above" className="text-right" />
                    <th className="hidden md:table-cell px-3 py-2 text-right text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Stop</th>
                    <SortHeader col="eps_growth_yoy" label="EPS YoY" className="hidden lg:table-cell text-right" />
                    <SortHeader col="rs_percentile" label="RS Pct" className="hidden lg:table-cell text-right" />
                    <th className="hidden xl:table-cell px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Sector</th>
                    <th className="hidden lg:table-cell px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Data</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakouts.map(entry => (
                    <BreakoutRow
                      key={entry.ticker}
                      entry={entry}
                      onView={() => openChartForBreakout(entry)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: SEARCH TICKER
      ══════════════════════════════════════════════════════ */}
      {tab === "ticker" && (
        <div className="space-y-4">
          {/* Search bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const t = tickerInput.trim().toUpperCase();
              if (!t) return;
              setSearchedTicker(t);
              const p = new URLSearchParams({ tab: "ticker", t });
              router.replace(`/canslim?${p.toString()}`);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                value={tickerInput}
                onChange={e => setTickerInput(e.target.value.toUpperCase())}
                placeholder="Enter ticker (e.g. TXN)"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Analyze
            </button>
          </form>

          {/* Results */}
          {!searchedTicker ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-sm">
              Enter a ticker above to run a full CAN SLIM analysis.
            </div>
          ) : canslimLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-lg bg-[var(--bg-card)] animate-pulse" />
              <div className="h-40 rounded-lg bg-[var(--bg-card)] animate-pulse" />
              <div className="h-72 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            </div>
          ) : canslimError ? (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)] text-sm mb-1">
                {(canslimError as Error).message?.includes("404")
                  ? `Ticker '${searchedTicker}' not found in the latest screener output.`
                  : `Failed to load CAN SLIM data for ${searchedTicker}.`}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Run <code className="font-mono">--screen</code> or <code className="font-mono">--daily-run</code> to include it in the universe.
              </p>
            </div>
          ) : canslimData ? (
            <div className="space-y-4">
              <CanslimScorecardCard result={canslimData} showChart={false} />
              <ChartPanel ticker={searchedTicker} />
            </div>
          ) : null}
        </div>
      )}

      {/* ── Chart modal ── */}
      <BreakoutChartModal
        ticker={chartTicker}
        entry={chartEntry}
        onClose={() => { setChartTicker(null); setChartEntry(null); }}
      />
    </div>
  );
}
