"use client";

import { useState, useMemo } from "react";
import { useEconomicCalendar, useEconomicData } from "@/hooks/use-economic";
import type {
  EconomicCalendarRelease,
  EconomicRelease,
  EconomicObservation,
} from "@/lib/types";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Constants ── */

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Inflation & Pricing Power": TrendingDown,
  "Labor Market": BarChart3,
  "Consumer & Economic Growth": TrendingUp,
  "Housing & Real Estate": CircleDot,
  "Interest Rates & Liquidity": AlertTriangle,
};

const CATEGORY_COLORS: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  "Inflation & Pricing Power": { dot: "bg-[var(--text-faint)]", bg: "bg-[var(--bg-primary)]", text: "text-[var(--text-muted)]", border: "border-[var(--border)]" },
  "Labor Market":              { dot: "bg-[var(--text-faint)]", bg: "bg-[var(--bg-primary)]", text: "text-[var(--text-muted)]", border: "border-[var(--border)]" },
  "Consumer & Economic Growth": { dot: "bg-[var(--text-faint)]", bg: "bg-[var(--bg-primary)]", text: "text-[var(--text-muted)]", border: "border-[var(--border)]" },
  "Housing & Real Estate":     { dot: "bg-[var(--text-faint)]", bg: "bg-[var(--bg-primary)]", text: "text-[var(--text-muted)]", border: "border-[var(--border)]" },
  "Interest Rates & Liquidity": { dot: "bg-[var(--text-faint)]", bg: "bg-[var(--bg-primary)]", text: "text-[var(--text-muted)]", border: "border-[var(--border)]" },
};

const SIGNAL_STYLES = {
  bullish: { bg: "bg-[var(--long)]/10", text: "text-[var(--long)]", border: "border-[var(--long)]/25", icon: ArrowUpRight },
  bearish: { bg: "bg-[var(--short)]/10", text: "text-[var(--short)]", border: "border-[var(--short)]/25", icon: ArrowDownRight },
  neutral: { bg: "bg-[var(--bg-primary)]", text: "text-[var(--text-muted)]", border: "border-[var(--border)]", icon: Minus },
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/* ── Helpers ── */

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function addWeeks(isoWeek: string, delta: number): string {
  // Get Monday date string (UTC) then parse as local parts to avoid timezone mismatch
  const mondayStr = getWeekStartDate(isoWeek); // "YYYY-MM-DD"
  const [y, m, d] = mondayStr.split("-").map(Number);
  // Add delta weeks using local Date arithmetic so getISOWeek's local methods work
  return getISOWeek(new Date(y, m - 1, d + delta * 7));
}

function getWeekDates(weekStart: string): string[] {
  const d = new Date(weekStart + "T00:00:00Z");
  return Array.from({ length: 5 }, (_, i) => {
    const day = new Date(d);
    day.setUTCDate(d.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

// Derive Monday date string directly from an ISO week string (no API needed)
function getWeekStartDate(isoWeek: string): string {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // ISO: Mon=1 … Sun=7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function isToday(dateStr: string): boolean {
  return new Date().toISOString().slice(0, 10) === dateStr;
}

function isPast(dateStr: string): boolean {
  return dateStr < new Date().toISOString().slice(0, 10);
}

function formatValue(value: number, unit: string): string {
  if (unit === "Percent") return value.toFixed(2) + "%";
  if (unit === "Index") return value.toFixed(1);
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toLocaleString();
}

/* ── Week Navigation ── */

function WeekNav({ week, onPrev, onNext, isCurrentWeek }: {
  week: string;
  onPrev: () => void;
  onNext: () => void;
  isCurrentWeek: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums min-w-[80px] text-center">
        {week}
      </span>
      <button
        onClick={onNext}
        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isCurrentWeek && (
        <button
          onClick={() => {/* reset handled by parent */}}
          className="text-xs text-[var(--accent)] hover:underline ml-1"
        >
          Today
        </button>
      )}
    </div>
  );
}

/* ── Calendar Widget ── */

function CalendarWidget({ weekStart, byDate, isLoading }: {
  weekStart: string;
  byDate?: Record<string, EconomicCalendarRelease[]>;
  isLoading?: boolean;
}) {
  const dates = getWeekDates(weekStart);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)]">
        <Calendar className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Weekly Economic Calendar
        </h2>
        {isLoading && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Loading releases…
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 divide-x divide-[var(--border)]">
        {dates.map((date, i) => {
          const today = isToday(date);
          const past = isPast(date);

          return (
            <div
              key={date}
              className={cn(
                "p-3 min-h-[140px] transition-colors",
                today && "bg-[var(--accent)]/5",
                past && !today && "opacity-60"
              )}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2.5">
                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  today ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                )}>
                  {DAY_NAMES[i]}
                </span>
                <span className={cn(
                  "text-xs tabular-nums",
                  today
                    ? "bg-[var(--accent)] text-white px-1.5 py-0.5 rounded font-semibold"
                    : "text-[var(--text-muted)]"
                )}>
                  {formatDay(date)}
                </span>
              </div>

              {/* Releases */}
              {isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-8 rounded bg-[var(--bg-primary)]" />
                </div>
              ) : (byDate?.[date] ?? []).length > 0 ? (
                <div className="space-y-1.5">
                  {(byDate![date]).map((r) => {
                    const catColor = CATEGORY_COLORS[r.category];
                    return (
                      <div
                        key={r.release_id}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-xs leading-tight border",
                          catColor?.bg ?? "bg-[var(--bg-primary)]",
                          catColor?.border ?? "border-[var(--border)]"
                        )}
                      >
                        <div className="flex items-start gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", catColor?.dot ?? "bg-[var(--text-muted)]")} />
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{r.release_name}</p>
                            <p className={cn("text-xs mt-0.5", catColor?.text ?? "text-[var(--text-muted)]")}>
                              {r.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : byDate ? (
                <p className="text-xs text-[var(--text-muted)] italic">No releases</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Signal Badge ── */

function SignalBadge({ signal }: { signal: "bullish" | "bearish" | "neutral" }) {
  const style = SIGNAL_STYLES[signal];
  const Icon = style.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border",
      style.bg, style.text, style.border
    )}>
      <Icon className="h-3 w-3" />
      {signal.charAt(0).toUpperCase() + signal.slice(1)}
    </span>
  );
}

/* ── Change Badge ── */

function ChangeBadge({ change, changePct, direction }: {
  change: number | null;
  changePct: number | null;
  direction: "up" | "down" | "flat" | null;
}) {
  if (changePct == null) return <span className="text-xs text-[var(--text-muted)]">--</span>;

  const color = direction === "up" ? "text-[var(--long)]" : direction === "down" ? "text-[var(--short)]" : "text-[var(--text-muted)]";
  const arrow = direction === "up" ? "+" : "";

  return (
    <span className={cn("text-xs font-semibold tabular-nums", color)}>
      {arrow}{changePct.toFixed(2)}%
    </span>
  );
}

/* ── Release Card ── */

function ReleaseCard({ release }: { release: EconomicRelease }) {
  const obs = release.observation;
  const catColor = CATEGORY_COLORS[release.category];
  const isUpcoming = release.current_week_dates.length > 0 && !release.current_week_dates.some(isPast);

  return (
    <div className={cn(
      "rounded-lg border bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--accent)]/30",
      obs?.signal === "bullish" ? "border-[var(--long)]/20" :
      obs?.signal === "bearish" ? "border-[var(--short)]/20" :
      "border-[var(--border)]"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full shrink-0", catColor?.dot ?? "bg-[var(--text-muted)]")} />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {release.release_name}
            </h3>
          </div>
          <p className={cn("text-xs uppercase tracking-wider", catColor?.text ?? "text-[var(--text-muted)]")}>
            {release.category}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isUpcoming && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20">
              Upcoming
            </span>
          )}
          {obs?.signal && <SignalBadge signal={obs.signal} />}
        </div>
      </div>

      {/* Data */}
      {obs ? (
        <div className="space-y-3">
          {/* Value row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-0.5">{obs.series_name}</p>
              <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatValue(obs.latest_value, obs.unit)}
              </p>
              <p className="text-xs text-[var(--text-muted)] tabular-nums mt-0.5">
                {obs.latest_date}
              </p>
            </div>
            <div className="text-right">
              <ChangeBadge change={obs.change} changePct={obs.change_pct} direction={obs.direction} />
              {obs.previous_value != null && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
                  prev: {formatValue(obs.previous_value, obs.unit)}
                </p>
              )}
            </div>
          </div>

          {/* Change bar */}
          {obs.change_pct != null && (
            <div className="h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  obs.signal === "bullish" ? "bg-[var(--long)]" :
                  obs.signal === "bearish" ? "bg-[var(--short)]" :
                  "bg-[var(--text-muted)]"
                )}
                style={{ width: `${Math.min(Math.abs(obs.change_pct) * 10, 100)}%` }}
              />
            </div>
          )}

          {/* Commentary */}
          {obs.commentary && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {obs.commentary}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-3">
          <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]/30" />
          <span className="text-xs text-[var(--text-muted)] italic">No observation data available</span>
        </div>
      )}

      {/* Date tags */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
        {release.current_week_dates.map((d) => (
          <span key={d} className={cn(
            "text-xs px-1.5 py-0.5 rounded tabular-nums",
            isToday(d)
              ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25"
              : isPast(d)
                ? "bg-[var(--bg-primary)] text-[var(--text-muted)]"
                : "bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20"
          )}>
            {formatDay(d)}
          </span>
        ))}
        {release.previous_week_dates.map((d) => (
          <span key={d} className="text-xs px-1.5 py-0.5 rounded tabular-nums bg-[var(--bg-primary)] text-[var(--text-muted)] line-through">
            {formatDay(d)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Category Section ── */

function CategorySection({ category, releases }: { category: string; releases: EconomicRelease[] }) {
  const catColor = CATEGORY_COLORS[category];
  const Icon = CATEGORY_ICONS[category] ?? BarChart3;

  // Summary stats
  const withData = releases.filter((r) => r.observation);
  const bullish = withData.filter((r) => r.observation?.signal === "bullish").length;
  const bearish = withData.filter((r) => r.observation?.signal === "bearish").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-md", catColor?.bg ?? "bg-[var(--bg-primary)]")}>
            <Icon className={cn("h-4 w-4", catColor?.text ?? "text-[var(--text-muted)]")} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{category}</h3>
        </div>
        {withData.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {bullish > 0 && (
              <span className="text-[var(--long)] font-medium">{bullish} bullish</span>
            )}
            {bearish > 0 && (
              <span className="text-[var(--short)] font-medium">{bearish} bearish</span>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {releases.map((r) => (
          <ReleaseCard key={r.release_id} release={r} />
        ))}
      </div>
    </div>
  );
}

/* ── Summary Bar ── */

function SummaryBar({ releases }: { releases: EconomicRelease[] }) {
  const withObs = releases.filter((r) => r.observation);
  const bullish = withObs.filter((r) => r.observation?.signal === "bullish").length;
  const bearish = withObs.filter((r) => r.observation?.signal === "bearish").length;
  const neutral = withObs.filter((r) => r.observation?.signal === "neutral").length;
  const total = bullish + bearish + neutral;

  if (total === 0) return null;

  const bullPct = (bullish / total) * 100;
  const bearPct = (bearish / total) * 100;

  const netSentiment = bullish > bearish ? "Bullish" : bearish > bullish ? "Bearish" : "Mixed";
  const sentimentColor = netSentiment === "Bullish" ? "text-[var(--long)]" : netSentiment === "Bearish" ? "text-[var(--short)]" : "text-[var(--caution)]";

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Market Sentiment</h2>
        <span className={cn("text-sm font-bold", sentimentColor)}>{netSentiment}</span>
      </div>

      {/* Sentiment bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-[var(--bg-primary)] mb-3">
        {bullPct > 0 && (
          <div className="bg-[var(--long)] transition-all duration-700" style={{ width: `${bullPct}%` }} />
        )}
        {bearPct > 0 && (
          <div className="bg-[var(--short)] transition-all duration-700" style={{ width: `${bearPct}%` }} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-[var(--long)] tabular-nums">{bullish}</p>
          <p className="text-xs text-[var(--text-muted)]">Bullish</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--text-muted)] tabular-nums">{neutral}</p>
          <p className="text-xs text-[var(--text-muted)]">Neutral</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--short)] tabular-nums">{bearish}</p>
          <p className="text-xs text-[var(--text-muted)]">Bearish</p>
        </div>
      </div>
    </section>
  );
}

/* ── Page ── */

export function EconomicPanel() {
  const currentWeek = getISOWeek(new Date());
  const [week, setWeek] = useState(currentWeek);
  const isCurrentWeek = week === currentWeek;

  const { data: calendar, isLoading: calLoading } = useEconomicCalendar(week);

  // Compute weekStart locally so navigation is instant — no API dependency
  const weekStart = useMemo(() => getWeekStartDate(week), [week]);
  const today = new Date().toISOString().slice(0, 10);
  // A week is "future" when its Monday hasn't arrived yet — no data released yet
  const isFutureWeek = weekStart > today;

  const { data: econData, isLoading: dataLoading } = useEconomicData(week, !isFutureWeek);

  // Group releases by category
  const grouped = useMemo(() => {
    if (!econData?.releases) return [];
    const map = new Map<string, EconomicRelease[]>();
    for (const r of econData.releases) {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    // Sort categories by the order in CATEGORY_COLORS
    const order = Object.keys(CATEGORY_COLORS);
    return Array.from(map.entries()).sort(
      ([a], [b]) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
    );
  }, [econData]);

  const handlePrev = () => setWeek((w) => addWeeks(w, -1));
  const handleNext = () => setWeek((w) => addWeeks(w, 1));
  const handleReset = () => setWeek(currentWeek);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Economic Data
          </h1>
          {!isCurrentWeek && (
            <button
              onClick={handleReset}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Back to this week
            </button>
          )}
        </div>
        <WeekNav
          week={week}
          onPrev={handlePrev}
          onNext={handleNext}
          isCurrentWeek={isCurrentWeek}
        />
      </div>

      {/* Calendar — always renders from local weekStart, API data overlays when ready */}
      <CalendarWidget
        weekStart={weekStart}
        byDate={calendar?.by_date}
        isLoading={calLoading}
      />

      {/* Future week — data not yet available */}
      {isFutureWeek && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 flex items-center gap-3">
          <Calendar className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
          <p className="text-sm text-[var(--text-muted)]">
            Economic data for{" "}
            <span className="font-medium text-[var(--text-primary)]">{week}</span>
            {" "}will be available once the week begins on{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {new Date(weekStart + "T00:00:00Z").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
              })}
            </span>.
          </p>
        </div>
      )}

      {/* Summary bar — current/past weeks only */}
      {!isFutureWeek && econData && <SummaryBar releases={econData.releases} />}

      {/* Category legend */}
      {!isFutureWeek && !dataLoading && grouped.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_COLORS).map(([cat, style]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs">
              <div className={cn("w-2 h-2 rounded-full", style.dot)} />
              <span className="text-[var(--text-muted)]">{cat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Released Data by Category — current/past weeks only */}
      {!isFutureWeek && (dataLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-48 rounded bg-[var(--bg-card)]" />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-40 rounded-lg bg-[var(--bg-card)]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(([category, releases]) => (
            <CategorySection key={category} category={category} releases={releases} />
          ))}
        </div>
      ) : econData ? (
        <div className="rounded-lg border border-[var(--caution)]/30 bg-[var(--caution)]/5 p-6 text-center">
          <p className="text-sm text-[var(--caution)]">No economic data available for this week.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            This may mean the FRED API key is not configured on the backend.
          </p>
        </div>
      ) : null)}
    </div>
  );
}
