"use client";

/**
 * Deep-links a jargon term to its definition in the backend's interactive
 * field guide (docs/guide/index.html, served at /guide/ — see
 * docs/ALPHASTREAM_UX_REDESIGN.md §4/§5.1 "Link glossary anchors to the
 * field guide"). Opens in a new tab so it never interrupts the page
 * being read.
 *
 * The slug algorithm mirrors the one that generated the guide's anchor
 * ids exactly: drop a trailing parenthetical, lowercase, non-alphanumerics
 * to hyphens. Pass the term as written in the guide's glossary (e.g.
 * "Gamma flip", "Open interest (OI)") and the anchor resolves without a
 * hardcoded id map to keep in sync.
 */

import { useAppStore } from "@/stores/app-store";
import { HelpCircle } from "lucide-react";

function slugify(term: string): string {
  const base = term.replace(/\(.*?\)/g, "").trim().toLowerCase();
  return base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function GlossaryLink({
  term,
  children,
  className,
}: {
  term: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const apiBaseUrl = useAppStore((s) => s.apiBaseUrl);
  const href = `${apiBaseUrl}/guide/#term-${slugify(term)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`What does "${term}" mean? — opens the field guide`}
      className={
        className ??
        "inline-flex items-center gap-1 text-[var(--text-primary)] hover:text-[var(--accent)] border-b border-dotted border-[var(--text-muted)] hover:border-[var(--accent)]"
      }
    >
      {children ?? term}
      <HelpCircle className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
    </a>
  );
}
