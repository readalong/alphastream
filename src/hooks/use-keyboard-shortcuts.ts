"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || (el as HTMLElement).isContentEditable;
}

interface UseKeyboardShortcutsOptions {
  onOpenPalette: () => void;
  onOpenShortcuts: () => void;
}

export function useKeyboardShortcuts({ onOpenPalette, onOpenShortcuts }: UseKeyboardShortcutsOptions) {
  const router = useRouter();

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      // Cmd/Ctrl+K — command palette (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      // All other shortcuts — skip when input is focused
      if (isInputFocused()) return;

      switch (e.key) {
        case "?":
          e.preventDefault();
          onOpenShortcuts();
          break;
        case "/":
          e.preventDefault();
          // Focus any visible ticker search input
          const input = document.querySelector<HTMLInputElement>("input[placeholder*='ticker'], input[placeholder*='Ticker'], input[placeholder*='Search'], input[placeholder*='search']");
          input?.focus();
          break;
        case "o":
        case "O":
          if (!e.metaKey && !e.ctrlKey) router.push("/today");
          break;
        case "s":
        case "S":
          if (!e.metaKey && !e.ctrlKey) router.push("/screener");
          break;
        case "r":
        case "R":
          if (!e.metaKey && !e.ctrlKey) router.push("/recommendations");
          break;
        case "f":
        case "F":
          if (!e.metaKey && !e.ctrlKey) router.push("/filter");
          break;
      }
    }

    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [router, onOpenPalette, onOpenShortcuts]);
}
