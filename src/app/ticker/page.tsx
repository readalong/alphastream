"use client";

/**
 * /ticker — merged ticker-search landing (Phase 3, docs/ALPHASTREAM_UX_
 * REDESIGN.md §Phase 3 Appendix: "/charts, /ticker -> merge -> /ticker/
 * [symbol] (Chart Studio as tab)"). Chart Studio's old standalone /charts
 * index page and this page were near-duplicates; this keeps the one
 * landing spot, both destinations now open the same deep-dive with its
 * Chart Studio tab available.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const QUICK_EXAMPLES = ["NVDA", "AAPL", "MSFT", "TSLA", "META", "AMZN", "GOOGL", "SPY"];

export default function TickerPage() {
  const [ticker, setTicker] = useState("");
  const router = useRouter();

  const navigate = (symbol: string) => {
    const t = symbol.trim().toUpperCase();
    if (t) router.push(`/ticker/${t}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ticker Lookup</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">
          Technical analysis, resistance mapping, earnings, news, and interactive Chart
          Studio — all in one deep-dive.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(ticker);
        }}
        className="flex gap-2 w-full max-w-sm"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g. NVDA)"
            className="w-full h-11 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          className="px-4 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Open
        </button>
      </form>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-[var(--text-muted)]">Quick access</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {QUICK_EXAMPLES.map((t) => (
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
