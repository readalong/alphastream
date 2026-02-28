"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Heart, ChevronRight } from "lucide-react";
import { useFavoritesStore, type FavoriteEntry } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";

interface SidebarFavoritesProps {
  onNavigate: () => void;
}

interface SectorGroup {
  sector: string;
  sectorEtf: string;
  tickers: FavoriteEntry[];
}

export function SidebarFavorites({ onNavigate }: SidebarFavoritesProps) {
  const favorites = useFavoritesStore((s) => s.favorites);
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(
    new Set()
  );

  const groups = useMemo(() => {
    const map = new Map<string, SectorGroup>();
    for (const fav of favorites) {
      const key = fav.sectorEtf || "_other";
      if (!map.has(key)) {
        map.set(key, {
          sector: fav.sector || "Other",
          sectorEtf: fav.sectorEtf,
          tickers: [],
        });
      }
      map.get(key)!.tickers.push(fav);
    }
    for (const group of map.values()) {
      group.tickers.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.sector === "Other") return 1;
      if (b.sector === "Other") return -1;
      return a.sector.localeCompare(b.sector);
    });
  }, [favorites]);

  const toggleSector = (key: string) => {
    setCollapsedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3 w-3 text-rose-500/70" fill="currentColor" />
          <p className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Watchlist
          </p>
        </div>
        {favorites.length > 0 && (
          <span className="flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-rose-500/10 text-[10px] font-semibold tabular-nums text-rose-400 border border-rose-500/10">
            {favorites.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {favorites.length === 0 && (
        <div className="px-3 py-5 text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] mb-2">
            <Heart className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]/60 leading-relaxed">
            Favorite tickers from their
            <br />
            chart page to build your list
          </p>
        </div>
      )}

      {/* Sector groups */}
      {favorites.length > 0 && (
        <div className="space-y-0.5">
          {groups.map((group) => {
            const key = group.sectorEtf || "_other";
            const isExpanded = !collapsedSectors.has(key);

            return (
              <div key={key}>
                {/* Sector header */}
                <button
                  onClick={() => toggleSector(key)}
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left rounded-md hover:bg-[var(--bg-card)] transition-colors group"
                >
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-[var(--text-muted)]/50 transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <span className="text-[11px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors flex-1 truncate">
                    {group.sector}
                  </span>
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)]/40">
                    {group.tickers.length}
                  </span>
                </button>

                {/* Ticker pills */}
                {isExpanded && (
                  <div className="pl-[26px] pr-2 pb-2 flex flex-wrap gap-1">
                    {group.tickers.map((fav) => (
                      <Link
                        key={fav.ticker}
                        href={`/ticker/${fav.ticker}`}
                        onClick={onNavigate}
                        className="px-2 py-[3px] rounded text-[11px] font-mono font-medium bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-colors"
                      >
                        {fav.ticker}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
