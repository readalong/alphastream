"use client";

/**
 * /flows — consolidates Sectors, Flow Map, and Capital Flow into one route
 * with tabs (Phase 3, docs/ALPHASTREAM_UX_REDESIGN.md §Phase 3/Appendix).
 * All three answer "where is money moving" at different granularities —
 * one destination.
 */

import { Suspense } from "react";
import { useTabParam, TabNav, type TabDef } from "@/components/layout/tab-nav";
import { SectorsPanel } from "@/components/flows/sectors-panel";
import { FlowMapPanel } from "@/components/flows/flow-map-panel";
import { CapitalFlowPanel } from "@/components/flows/capital-flow-panel";

const TABS: TabDef[] = [
  { key: "sectors", label: "Sectors" },
  { key: "flow-map", label: "Flow Map" },
  { key: "capital-flow", label: "Capital Flow" },
];

function FlowsPageInner() {
  const { active, setActive } = useTabParam(TABS, "sectors");

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Flows</h1>
      </div>

      <TabNav tabs={TABS} active={active} onChange={setActive} />

      {active === "sectors" && <SectorsPanel />}
      {active === "flow-map" && <FlowMapPanel />}
      {active === "capital-flow" && <CapitalFlowPanel />}
    </div>
  );
}

export default function FlowsPage() {
  return (
    <Suspense fallback={null}>
      <FlowsPageInner />
    </Suspense>
  );
}
