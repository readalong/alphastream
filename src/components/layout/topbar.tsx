"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
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

      {/* Quick Search */}
      <form onSubmit={handleSubmit} className="relative mr-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Quick lookup..."
          className="h-8 w-40 md:w-56 pl-8 pr-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </form>

      <ThemeToggle />

      {/* Health Status Dot */}
      <div className="ml-3 flex items-center gap-1.5">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            isHealthy ? "bg-green-500" : "bg-red-500"
          )}
          title={isHealthy ? "Backend connected" : "Backend unreachable"}
        />
      </div>
    </header>
  );
}
