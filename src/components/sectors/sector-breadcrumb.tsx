"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SECTOR_ETF_NAMES } from "@/lib/constants";

interface SectorBreadcrumbProps {
  sectorEtf?: string;
  industry?: string;
}

export function SectorBreadcrumb({ sectorEtf, industry }: SectorBreadcrumbProps) {
  const sectorName = sectorEtf ? SECTOR_ETF_NAMES[sectorEtf] || sectorEtf : null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-4">
      <Link href="/sectors" className="hover:text-[var(--accent)] transition-colors">
        Sectors
      </Link>
      {sectorEtf && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/sectors/${sectorEtf}`}
            className="hover:text-[var(--accent)] transition-colors"
          >
            {sectorName} ({sectorEtf})
          </Link>
        </>
      )}
      {industry && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[var(--text-primary)]">{industry}</span>
        </>
      )}
    </nav>
  );
}
