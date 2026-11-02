import { cn } from "@/lib/utils";
import type { CANSLIMGrade } from "@/lib/types";

export const GRADE_STYLE: Record<CANSLIMGrade, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  B: { bg: "bg-sky-500/15",     text: "text-sky-400",     border: "border-sky-500/30"     },
  C: { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30"   },
  D: { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30"     },
};

interface GradeBadgeProps {
  score: number;
  grade: CANSLIMGrade;
  size?: "sm" | "lg";
}

export function GradeBadge({ score, grade, size = "sm" }: GradeBadgeProps) {
  const s = GRADE_STYLE[grade];

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-lg border px-4 py-2", s.bg, s.border)}>
        <span className={cn("text-3xl font-black tabular-nums leading-none", s.text)}>{grade}</span>
        <span className="text-xs text-[var(--text-muted)] mt-0.5">{score}/7</span>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold", s.bg, s.border)}>
      <span className="text-[var(--text-muted)] font-normal">{score}/7</span>
      <span className={s.text}>{grade}</span>
    </span>
  );
}
