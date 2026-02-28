"use client";

import { useSectors } from "@/hooks/use-sectors";
import { SECTOR_ETF_NAMES } from "@/lib/constants";

interface SectorFilterDropdownProps {
  value: string | null;
  onChange: (etf: string | null) => void;
}

export function SectorFilterDropdown({ value, onChange }: SectorFilterDropdownProps) {
  const { data: sectors } = useSectors();

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 px-3 rounded-md text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
    >
      <option value="">All Sectors</option>
      {sectors?.map((s) => (
        <option key={s.sector_etf} value={s.sector_etf}>
          {s.sector_etf} - {SECTOR_ETF_NAMES[s.sector_etf] || s.sector_names[0]} ({s.ticker_count})
        </option>
      ))}
    </select>
  );
}
