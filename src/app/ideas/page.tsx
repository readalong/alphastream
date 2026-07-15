"use client";

/**
 * /ideas — consolidates Recommendations, Setup Filter, Screener, and
 * Uptrend Analysis into one route (Phase 3,
 * docs/ALPHASTREAM_UX_REDESIGN.md §Phase 3 "merge the four buy-pages into
 * /ideas (normalized rank + source filter drawer)"). "All Ideas" is the
 * new unified queue; the other four tabs are each engine's full detail
 * view, unchanged, so nothing is lost in the merge.
 */

import { Suspense } from "react";
import { useTabParam, TabNav, type TabDef } from "@/components/layout/tab-nav";
import { AllIdeasPanel } from "@/components/ideas/all-ideas-panel";
import { RecommendationsPanel } from "@/components/ideas/recommendations-panel";
import { FilterPanel } from "@/components/ideas/filter-panel";
import { ScreenerPanel } from "@/components/ideas/screener-panel";
import { UptrendPanel } from "@/components/ideas/uptrend-panel";

const TABS: TabDef[] = [
  { key: "all", label: "All Ideas" },
  { key: "recommendations", label: "Recommendations" },
  { key: "filter", label: "Setup Filter" },
  { key: "screener", label: "Screener" },
  { key: "uptrend", label: "Uptrend" },
];

function IdeasPageInner() {
  const { active, setActive } = useTabParam(TABS, "all");

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Ideas</h1>
      </div>

      <TabNav tabs={TABS} active={active} onChange={setActive} />

      {active === "all" && <AllIdeasPanel />}
      {active === "recommendations" && <RecommendationsPanel />}
      {active === "filter" && <FilterPanel />}
      {active === "screener" && <ScreenerPanel />}
      {active === "uptrend" && <UptrendPanel />}
    </div>
  );
}

export default function IdeasPage() {
  return (
    <Suspense fallback={null}>
      <IdeasPageInner />
    </Suspense>
  );
}
