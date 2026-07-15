"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl/⌘", "K"], action: "Open command palette" },
  { keys: ["/"], action: "Focus ticker search" },
  { keys: ["O"], action: "Go to Today" },
  { keys: ["S"], action: "Go to Screener (Ideas)" },
  { keys: ["R"], action: "Go to Recommendations (Ideas)" },
  { keys: ["F"], action: "Go to Setup Filter (Ideas)" },
  { keys: ["?"], action: "Show this shortcut guide" },
  { keys: ["Esc"], action: "Close panel / modal" },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {SHORTCUTS.map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">{action}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <p className="text-xs text-[var(--text-muted)]">
            Shortcuts work everywhere except when an input is focused.
          </p>
        </div>
      </div>
    </div>
  );
}
