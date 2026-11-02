import { cn } from "@/lib/utils";
import type { PatternType, PatternStage } from "@/lib/types";

const PATTERN_LABELS: Partial<Record<PatternType, string>> = {
  CUP_AND_HANDLE:  "C&H",
  FLAT_BASE:       "Flat Base",
  DOUBLE_BOTTOM:   "Dbl Bot",
  SAUCER:          "Saucer",
  HIGH_TIGHT_FLAG: "HTF",
};

const STAGE_STYLES: Record<PatternStage, { border: string; dot: string; text: string }> = {
  FORMING:           { border: "border-[var(--border)]",    dot: "bg-[var(--text-muted)]", text: "text-[var(--text-muted)]" },
  CUP_COMPLETE:      { border: "border-blue-500/40",        dot: "bg-blue-400",            text: "text-blue-400"  },
  HANDLE:            { border: "border-amber-500/40",       dot: "bg-amber-400",           text: "text-amber-400" },
  BREAKOUT:          { border: "border-emerald-500/40",     dot: "bg-emerald-400",         text: "text-emerald-400" },
  EXTENDED:          { border: "border-orange-500/40",      dot: "bg-orange-400",          text: "text-orange-400" },
  INSUFFICIENT_DATA: { border: "border-[var(--border)]",    dot: "bg-[var(--text-muted)]", text: "text-[var(--text-muted)]" },
};

interface PatternBadgeProps {
  pattern: PatternType;
  stage: PatternStage;
  size?: "sm" | "md";
}

export function PatternBadge({ pattern, stage, size = "sm" }: PatternBadgeProps) {
  const label = PATTERN_LABELS[pattern];
  if (!label) return null;

  const s = STAGE_STYLES[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        "bg-[var(--bg-primary)]",
        s.border
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", s.dot)} />
      <span className="text-[var(--text-primary)]">{label}</span>
      <span className={cn("font-normal", s.text)}>· {stage}</span>
    </span>
  );
}
