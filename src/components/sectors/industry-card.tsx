"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { IndustryInfo } from "@/lib/types";

interface IndustryCardProps {
  industry: IndustryInfo;
  sectorEtf: string;
}

export function IndustryCard({ industry, sectorEtf }: IndustryCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-2">
      <h3 className="font-medium text-[var(--text-primary)]">
        {industry.industry}
      </h3>
      <p className="text-xs text-[var(--text-muted)]">
        {industry.ticker_count} tickers
      </p>
      <Link
        href={`/sectors/${sectorEtf}/${encodeURIComponent(industry.industry)}`}
        className="mt-auto inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
      >
        View industry
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
