"use client";

/**
 * /markets — consolidates Overview, Global Markets, Economic Data,
 * Market Internals, and CTA Positioning into one route with tabs (Phase 3,
 * docs/ALPHASTREAM_UX_REDESIGN.md §Phase 3/Appendix). These all answer
 * "what's the market doing" — one destination, not five. CTA Positioning
 * used to be its own standalone page; it's macro-wide (equities, bonds,
 * commodities), so it lives here rather than on /futures.
 */

import { Suspense } from "react";
import { useTabParam, TabNav, type TabDef } from "@/components/layout/tab-nav";
import { OverviewPanel } from "@/components/markets/overview-panel";
import { GlobalPanel } from "@/components/markets/global-panel";
import { InternalsPanel } from "@/components/markets/internals-panel";
import { EconomicPanel } from "@/components/markets/economic-panel";
import { CtaPanel } from "@/components/markets/cta-panel";

const TABS: TabDef[] = [
  { key: "overview", label: "Overview" },
  { key: "global", label: "Global" },
  { key: "internals", label: "Internals" },
  { key: "economic", label: "Economic" },
  { key: "cta", label: "CTA Positioning" },
];

function MarketsPageInner() {
  const { active, setActive } = useTabParam(TABS, "overview");

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Markets</h1>
      </div>

      <TabNav tabs={TABS} active={active} onChange={setActive} />

      {active === "overview" && <OverviewPanel />}
      {active === "global" && <GlobalPanel />}
      {active === "internals" && <InternalsPanel />}
      {active === "economic" && <EconomicPanel />}
      {active === "cta" && <CtaPanel />}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={null}>
      <MarketsPageInner />
    </Suspense>
  );
}
