"use client";

import { formatPrice } from "@/lib/utils";
import { StageBadge } from "@/components/charts/stage-badge";
import { ResistanceLevelRow } from "./resistance-level-row";
import { ResistanceZoneDetail } from "./resistance-zone-detail";
import { AthBadge } from "./ath-badge";
import type { ResistanceResponse } from "@/lib/types";

interface ResistanceSummaryCardProps {
  ticker: string;
  data: ResistanceResponse;
  stage?: string;
  category?: string;
}

export function ResistanceSummaryCard({
  ticker,
  data,
  stage,
  category,
}: ResistanceSummaryCardProps) {
  const hasResistance = data.levels.length > 0;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        {ticker} — Upside Resistance
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)] text-sm">Current Price</span>
          <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
            ${formatPrice(data.current_price)}
          </span>
        </div>
        {stage && (
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)] text-sm">Stage</span>
            <span className="text-sm text-[var(--text-primary)]">{stage}</span>
          </div>
        )}
        {category && (
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)] text-sm">Category</span>
            <StageBadge category={category} />
          </div>
        )}

        {hasResistance ? (
          <>
            <div className="pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-muted)] text-sm block mb-2">
                Resistance Levels
              </span>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="text-left font-medium py-1 pr-3">Level</th>
                    <th className="text-left font-medium py-1 pr-3">Price</th>
                    <th className="text-left font-medium py-1 pr-3">%&uarr;</th>
                    <th className="text-left font-medium py-1">Str</th>
                  </tr>
                </thead>
                <tbody>
                  {data.levels.map((level, i) => (
                    <ResistanceLevelRow
                      key={i}
                      label={`R${i + 1}`}
                      price={level.price}
                      pctAbove={level.pct_above}
                      strength={level.strength}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Zone details for first level */}
            {data.levels[0] && (
              <ResistanceZoneDetail level={data.levels[0]} label="R1" />
            )}
          </>
        ) : (
          <div className="pt-2 border-t border-[var(--border)]">
            <AthBadge />
          </div>
        )}
      </div>
    </div>
  );
}
