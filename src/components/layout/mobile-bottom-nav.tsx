"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Waves,
  Gauge,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTriageCounts } from "@/hooks/use-triage";
import { NavBadge } from "./nav-badge";

const NAV_ITEMS = [
  { href: "/today",     icon: LayoutDashboard, label: "Today",     countKey: "actOpenCount" as const },
  { href: "/ideas",     icon: Target,          label: "Ideas" },
  { href: "/flows",     icon: Waves,           label: "Flows" },
  { href: "/futures",   icon: Gauge,           label: "Futures" },
  { href: "/book",      icon: Briefcase,       label: "Book",      countKey: "bookActOpenCount" as const },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const counts = useTriageCounts();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-[var(--border)] bg-[var(--bg-sidebar)] h-14 safe-area-bottom">
      {NAV_ITEMS.map(({ href, icon: Icon, label, countKey }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors",
              active
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {countKey && (
                <span className="absolute -top-1 -right-2">
                  <NavBadge count={counts[countKey]} />
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
