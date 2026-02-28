"use client";

import { formatPrice } from "@/lib/utils";
import { StrengthBar } from "./strength-bar";

interface ResistanceLevelRowProps {
  label: string;
  price: number;
  pctAbove: number;
  strength: number;
}

export function ResistanceLevelRow({
  label,
  price,
  pctAbove,
  strength,
}: ResistanceLevelRowProps) {
  return (
    <tr className="border-t border-[var(--border)]/30">
      <td className="py-2 pr-3 text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </td>
      <td className="py-2 pr-3 font-mono tabular-nums text-sm text-[var(--text-primary)]">
        ${formatPrice(price)}
      </td>
      <td className="py-2 pr-3 text-sm text-[var(--text-muted)]">
        {pctAbove.toFixed(1)}%
      </td>
      <td className="py-2">
        <StrengthBar strength={strength} />
      </td>
    </tr>
  );
}
