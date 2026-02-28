"use client";

import { useIndustries } from "@/hooks/use-industries";

interface IndustryFilterDropdownProps {
  sectorEtf: string | null;
  value: string | null;
  onChange: (industry: string | null) => void;
}

export function IndustryFilterDropdown({
  sectorEtf,
  value,
  onChange,
}: IndustryFilterDropdownProps) {
  const { data: industries } = useIndustries(sectorEtf);

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={!sectorEtf}
      className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
    >
      <option value="">All Industries</option>
      {industries?.map((ind) => (
        <option key={ind.industry} value={ind.industry}>
          {ind.industry} ({ind.ticker_count})
        </option>
      ))}
    </select>
  );
}
