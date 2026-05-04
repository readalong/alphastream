"use client";

import type { AlphaLensContext } from "@/lib/alpha-lens-context";

interface QuickAction {
  label: string;
  prompt: string;
}

function buildActions(context: AlphaLensContext): QuickAction[] {
  const actions: QuickAction[] = [];

  // Always available
  actions.push({ label: "Summarize signals", prompt: "Summarize the key technical signals and what they suggest about the current setup." });

  // Earnings proximity
  if (context.earnings?.daysUntil != null && context.earnings.daysUntil <= 14) {
    actions.push({ label: `Earnings in ${context.earnings.daysUntil}d — hold or exit?`, prompt: `Earnings are in ${context.earnings.daysUntil} days. Should I hold my position, exit before earnings, or avoid entry? Consider IV risk and historical patterns.` });
  }

  // Resistance levels
  if (context.resistance && context.resistance.levels.length > 0) {
    const r1 = context.resistance.levels[0];
    actions.push({ label: `R1 at $${r1.price.toFixed(2)} — realistic target?`, prompt: `The first resistance level (R1) is at $${r1.price.toFixed(2)}, which is ${r1.pct_above.toFixed(1)}% above current price. Is this a realistic target given the current setup, and what should I watch for at that level?` });
  }

  // AI analysis verdict
  if (context.aiAnalysis && !context.aiAnalysis.error) {
    actions.push({ label: "Explain AI verdict", prompt: "Explain the AI analysis verdict in plain language — what does it mean for my trading decision?" });
  }

  // Stage-specific
  const category = context.screener?.category;
  if (category) {
    const catLower = category.toLowerCase();
    if (catLower.includes("sure") || catLower === "s") {
      actions.push({ label: "Why Sure Shot?", prompt: "What factors make this a Sure Shot (S) category setup? What specifically distinguishes it from a regular Action setup?" });
    } else if (catLower.includes("bounce") || catLower === "b") {
      actions.push({ label: "Bounce setup risks?", prompt: "This is a Bounce (B) category setup. What are the key risks, and what would confirm or invalidate the bounce thesis?" });
    } else {
      actions.push({ label: "Explain stage", prompt: "Explain what the current Minervini stage means and its implications for this stock." });
    }
  } else {
    actions.push({ label: "Explain stage", prompt: "Explain what the current Minervini stage means and its implications for this stock." });
  }

  // Sector outlook (always useful)
  actions.push({ label: "Sector outlook", prompt: "Search for the latest sector outlook and trends for this stock's sector." });

  return actions.slice(0, 4); // cap at 4 suggestions
}

interface QuickActionsProps {
  context: AlphaLensContext;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActions({ context, onSelect, disabled }: QuickActionsProps) {
  const actions = buildActions(context);
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className="px-2.5 py-1 rounded-full text-xs border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
