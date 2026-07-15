"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick: () => void;
  onOpenPalette?: () => void;
}

export function Topbar({ onMenuClick, onOpenPalette }: TopbarProps) {
  const [ticker, setTicker] = useState("");
  const router = useRouter();
  const { data: health, isError } = useHealth();

  const isHealthy = !!health && !isError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    if (symbol) {
      router.push(`/ticker/${symbol}`);
      setTicker("");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 border-b bg-[var(--bg-primary)] border-[var(--border)]">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      {/* Command palette trigger */}
      {onOpenPalette && (
        <button
          onClick={onOpenPalette}
          className="hidden md:flex items-center gap-2 h-8 px-3 mr-2 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-1 px-1.5 py-0.5 text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border)]">⌘K</kbd>
        </button>
      )}

      {/* Quick ticker lookup (mobile / fallback) */}
      <form onSubmit={handleSubmit} className="relative mr-3 md:hidden">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker…"
          className="h-8 w-32 pl-8 pr-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </form>

      <ThemeToggle />

      {/* Health Status Dot */}
      <div className="ml-3 flex items-center gap-1.5">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            isHealthy ? "bg-[var(--long)]" : "bg-[var(--short)]"
          )}
          title={isHealthy ? "Backend connected" : "Backend unreachable"}
        />
      </div>
    </header>
  );
}
