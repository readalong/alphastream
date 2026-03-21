"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Search } from "lucide-react";

const RECENT_EXAMPLES = ["NVDA", "AAPL", "MSFT", "TSLA", "META", "AMZN", "GOOGL", "SPY"];

export default function ChartsIndexPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const navigate = (ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (t) router.push(`/charts/${t}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <BarChart2 className="h-10 w-10 text-[var(--accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Chart Studio</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">
          Interactive candlestick charts with trendlines, Fibonacci retracements, channels, and Elliott Wave analysis.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(input);
        }}
        className="flex gap-2 w-full max-w-sm"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g. NVDA)"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Open
        </button>
      </form>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-[var(--text-muted)]">Quick access</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {RECENT_EXAMPLES.map((t) => (
            <button
              key={t}
              onClick={() => navigate(t)}
              className="px-3 py-1 rounded-full text-xs border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
