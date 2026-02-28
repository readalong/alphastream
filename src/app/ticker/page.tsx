"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function TickerPage() {
  const [ticker, setTicker] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    if (symbol) {
      router.push(`/ticker/${symbol}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Ticker Lookup
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Enter a ticker symbol to view its analysis
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker symbol (e.g., NVDA)"
            className="w-full h-12 pl-10 pr-4 rounded-lg text-base bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            autoFocus
          />
        </div>
      </form>
    </div>
  );
}
