"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanSearch,
  Search,
  FolderOpen,
  Zap,
  Settings,
  X,
  TrendingUp,
  BarChart3,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarFavorites } from "./sidebar-favorites";

const NAV_SECTIONS = [
  {
    label: "DISCOVER",
    items: [
      { name: "Overview", href: "/overview", icon: LayoutDashboard },
      { name: "Global Markets", href: "/markets", icon: Globe },
      { name: "Screener", href: "/screener", icon: ScanSearch },
      { name: "Sectors", href: "/sectors", icon: BarChart3 },
      { name: "Uptrend Analysis", href: "/uptrend", icon: TrendingUp },
    ],
  },
  {
    label: "ANALYZE",
    items: [
      { name: "Ticker Lookup", href: "/ticker", icon: Search },
      { name: "Sessions", href: "/sessions", icon: FolderOpen },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { name: "Jobs", href: "/jobs", icon: Zap },
      { name: "Settings", href: "/settings", icon: Settings },
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
          <Link href="/overview" className="flex items-center gap-2 font-semibold text-[var(--accent)]">
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
