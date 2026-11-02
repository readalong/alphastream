import { cn } from "@/lib/utils";
import type { ActionType } from "@/lib/types";

const ACTION_STYLE: Record<ActionType, { bg: string; text: string; border: string }> = {
  BUY:       { bg: "bg-[#0d2818]", text: "text-[#39d353]", border: "border-[#39d353]" },
  ALERT:     { bg: "bg-[#1a1a00]", text: "text-[#f59e0b]", border: "border-[#f59e0b]" },
  WATCHLIST: { bg: "bg-[#111827]", text: "text-[#8b949e]", border: "border-[#374151]" },
  WAIT:      { bg: "bg-[#1a1000]", text: "text-[#f59e0b]", border: "border-[#78350f]" },
  NO_BUY:    { bg: "bg-[#1a0808]", text: "text-[#ff4d6d]", border: "border-[#ff4d6d]" },
  SKIP:      { bg: "bg-[#0d1117]", text: "text-[#4b5563]", border: "border-[#374151]" },
};

interface ActionBadgeProps {
  action: ActionType;
  size?: "sm" | "md";
}

export function ActionBadge({ action, size = "md" }: ActionBadgeProps) {
  const s = ACTION_STYLE[action];
  return (
    <span className={cn(
      "inline-flex items-center rounded border font-semibold uppercase tracking-wider",
      size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
      s.bg, s.text, s.border
    )}>
      {action}
    </span>
  );
}

interface ConvictionBarProps {
  value: number; // 0–100
}

export function ConvictionBar({ value }: ConvictionBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 70 ? "bg-[#39d353]" :
    clamped >= 50 ? "bg-[#f59e0b]" :
    "bg-[#374151]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-[11px] font-mono text-[var(--text-muted)] w-6 text-right shrink-0">
        {Math.round(clamped)}
      </span>
    </div>
  );
}
