"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  FolderOpen,
  Zap,
  Settings,
  X,
  TrendingUp,
  Globe,
  Target,
  Swords,
  Gauge,
  Waves,
  BookOpen,
  Briefcase,
  Sun,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarFavorites } from "./sidebar-favorites";

const IS_PRODUCTION = process.env.NEXT_PUBLIC_APP_ENV === "production";

/* Consolidated IA (Phase 3, docs/ALPHASTREAM_UX_REDESIGN.md §3.1/Appendix):
   22 routes -> ~9 core destinations. TODAY is the landing queue; MARKETS
   is context & evidence; IDEAS is discovery & research; MANAGE is the
   utility cluster, collapsed by default in spirit (dev-only items hidden
   in production). */
const NAV_SECTIONS = [
  {
    label: "TODAY",
    items: [{ name: "Today", href: "/today", icon: Sun }],
  },
  {
    label: "MARKETS",
    items: [
      { name: "Markets", href: "/markets", icon: Globe },
      { name: "Options (GEX)", href: "/options", icon: Zap },
      { name: "Futures", href: "/futures", icon: Gauge },
      { name: "Flows", href: "/flows", icon: Waves },
      { name: "Strategy", href: "/strategy", icon: Swords },
    ],
  },
  {
    label: "IDEAS",
    items: [
      { name: "Ideas", href: "/ideas", icon: Target },
      { name: "Ticker Lookup", href: "/ticker", icon: Search },
      { name: "Track Record", href: "/track-record", icon: Check },
    ],
  },
  {
    label: "MANAGE",
    items: [
      ...(!IS_PRODUCTION ? [{ name: "Sessions", href: "/sessions", icon: FolderOpen }] : []),
      ...(!IS_PRODUCTION ? [{ name: "Jobs", href: "/jobs", icon: Zap }] : []),
      { name: "Portfolio", href: "/portfolio", icon: Briefcase },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "User Guide", href: "/guide", icon: BookOpen },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-60 flex-shrink-0 flex flex-col border-r transition-transform duration-200",
          "bg-[var(--bg-sidebar)] border-[var(--border)]",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)]">
          <Link href="/today" className="flex items-center gap-2 font-semibold text-[var(--accent)]">
            <TrendingUp className="h-5 w-5" />
            <span>AlphaStream</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
          <SidebarFavorites onNavigate={onClose} />
        </nav>
      </aside>
    </>
  );
}
