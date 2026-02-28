"use client";

const ACTIONS = [
  { label: "Summarize signals", prompt: "Summarize the key technical signals and what they suggest about the current setup." },
  { label: "Explain stage", prompt: "Explain what the current Minervini stage means and its implications for this stock." },
  { label: "Risk factors", prompt: "What are the main risk factors for this stock based on the available data?" },
  { label: "Sector outlook", prompt: "Search for the latest sector outlook and trends for this stock's sector." },
];

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ACTIONS.map((action) => (
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
