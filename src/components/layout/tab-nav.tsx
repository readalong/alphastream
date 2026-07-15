"use client";

/**
 * Shared tab shell for Phase 3's consolidated routes (/markets, /flows,
 * /ideas, /ticker) — docs/ALPHASTREAM_UX_REDESIGN.md §3.1/§Phase 3. Active
 * tab is a URL search param (?tab=) so every tab is deep-linkable and old
 * routes can redirect straight to their new home (e.g. /internals ->
 * /markets?tab=internals).
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabDef {
  key: string;
  label: string;
}

export function useTabParam(tabs: TabDef[], defaultTab: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get("tab");
  const active = tabs.some((t) => t.key === raw) ? (raw as string) : defaultTab;

  const setActive = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === defaultTab) {
      params.delete("tab");
    } else {
      params.set("tab", key);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return { active, setActive };
}

export function TabNav({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "px-3.5 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
            active === t.key
              ? "border-[var(--accent)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
