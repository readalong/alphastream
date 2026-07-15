"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, LayoutDashboard, ScanSearch, Target, Filter, BarChart3, Globe, Waves, Swords, TrendingUp, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites-store";
import { SECTOR_ETF_NAMES } from "@/lib/constants";

const PAGES = [
  { name: "Today", href: "/today", icon: LayoutDashboard, description: "What to do, watch, and avoid today" },
  { name: "Markets", href: "/markets", icon: Globe, description: "Overview, global markets, internals, economic, CTA" },
  { name: "Futures", href: "/futures", icon: TrendingUp, description: "Bias, tier, today's action, setups" },
  { name: "Options (GEX)", href: "/options", icon: Zap, description: "Gamma exposure, regime, level ladder" },
  { name: "Flows", href: "/flows", icon: Waves, description: "Sectors, flow map, capital flow" },
  { name: "Strategy", href: "/strategy", icon: Swords, description: "Regime & allocation" },
  { name: "Ideas", href: "/ideas", icon: Target, description: "Recommendations, setup filter, screener, uptrend" },
  { name: "Setup Filter", href: "/ideas?tab=filter", icon: Filter, description: "Ranked shortlist" },
  { name: "Screener", href: "/ideas?tab=screener", icon: ScanSearch, description: "Full universe scan" },
  { name: "Track Record", href: "/track-record", icon: Check, description: "Live scorecard & backtest findings" },
  { name: "Ticker Lookup", href: "/ticker", icon: Search, description: "Technical analysis & Chart Studio" },
];

const SECTOR_ENTRIES = Object.entries(SECTOR_ETF_NAMES).map(([etf, name]) => ({
  name: etf,
  description: name,
  href: `/sectors/${etf}`,
  icon: BarChart3,
}));

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { favorites } = useFavoritesStore();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useCallback(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show recent tickers + top pages
      const recentTickers = favorites.slice(0, 5).map(f => ({
        name: f.ticker,
        description: f.sector || f.sectorEtf || "Ticker",
        href: `/ticker/${f.ticker}`,
        icon: TrendingUp,
        group: "Recent",
      }));
      return [...recentTickers, ...PAGES.slice(0, 5).map(p => ({ ...p, group: "Pages" }))];
    }
    const tickerMatch = q.match(/^[a-z]{1,5}$/i) ? [{
      name: q.toUpperCase(),
      description: "Go to ticker detail",
      href: `/ticker/${q.toUpperCase()}`,
      icon: TrendingUp,
      group: "Ticker",
    }] : [];
    const pageMatches = PAGES.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    ).map(p => ({ ...p, group: "Pages" }));
    const sectorMatches = SECTOR_ENTRIES.filter(s =>
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    ).slice(0, 4).map(s => ({ ...s, group: "Sectors" }));
    return [...tickerMatch, ...pageMatches, ...sectorMatches];
  }, [query, favorites]);

  const items = results();

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && items[selected]) { navigate(items[selected].href); }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, items, selected, navigate, onClose]);

  if (!open) return null;

  // Group items
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const g = (item as typeof items[0] & { group: string }).group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-lg overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, sectors, tickers…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-xs font-mono border border-[var(--border)] text-[var(--text-muted)]">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No results</p>
          ) : (
            Object.entries(groups).map(([group, groupItems]) => (
              <div key={group}>
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {group}
                </p>
                {groupItems.map((item) => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        selected === idx ? "bg-[var(--accent)]/10" : "hover:bg-[var(--bg-primary)]"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", selected === idx ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium", selected === idx ? "text-[var(--accent)]" : "text-[var(--text-primary)]")}>
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          <span className="ml-auto">Type a ticker symbol to jump directly</span>
        </div>
      </div>
    </div>
  );
}
