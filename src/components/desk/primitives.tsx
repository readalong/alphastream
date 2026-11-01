"use client";

/* Small building blocks shared by /desk, /theses and /research. They follow
   the Phase 4 design rules (globals.css): ink on paper, --accent only for
   interaction, --long/--short/--caution only to encode direction/severity. */

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function fmtNum(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtSigned(v: number | null | undefined, digits = 1, suffix = ""): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v >= 0 ? "+" : ""}${fmtNum(v, digits)}${suffix}`;
}

/** Dollar gamma in billions, e.g. -14.43B. */
export function fmtBn(v: number | null | undefined, digits = 2): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v >= 0 ? "+" : ""}${(v / 1e9).toFixed(digits)}B`;
}

/** Colour a signed value by direction only. */
export function signClass(v: number | null | undefined): string {
  if (v == null || v === 0 || Number.isNaN(v)) return "text-[var(--text-muted)]";
  return v > 0 ? "text-[var(--long)]" : "text-[var(--short)]";
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4", className)}>
      <header className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

export function NotRun({ what }: { what: string }) {
  return <p className="text-sm text-[var(--text-muted)]">{what} not run tonight.</p>;
}

export function EmptyState({ title, command }: { title: string; command: string }) {
  return (
    <div className="max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h1 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h1>
      <p className="text-sm text-[var(--text-muted)]">
        Run <code className="font-mono text-[var(--text-primary)]">python main.py {command}</code> on the
        backend; this page picks it up automatically.
      </p>
    </div>
  );
}

export function StaleBanner({ date, command }: { date: string; command: string }) {
  return (
    <p className="flex items-start gap-2 border border-[var(--caution)]/30 bg-[var(--caution)]/10 px-3 py-2 text-sm text-[var(--caution)]">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        This is {date}&apos;s data. Run <code className="font-mono">{command}</code> on the backend to refresh.
      </span>
    </p>
  );
}

/** A labelled 0-100 bar. */
export function PctBar({ label, value, hint }: { label: string; value: number | null | undefined; hint?: string }) {
  const v = value == null || Number.isNaN(value) ? null : Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1" title={hint}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-mono tabular-nums text-[var(--text-primary)]">{v == null ? "—" : `${fmtNum(v)}%`}</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-primary)] border border-[var(--border)]">
        {v != null && (
          <div
            className={cn("h-full", v >= 50 ? "bg-[var(--long)]" : "bg-[var(--short)]")}
            style={{ width: `${v}%`, opacity: 0.7 }}
          />
        )}
      </div>
    </div>
  );
}

export function Chip({ tone, children }: { tone: "long" | "short" | "caution" | "muted"; children: ReactNode }) {
  const cls = {
    long: "text-[var(--long)] border-[var(--long)]/30 bg-[var(--long)]/5",
    short: "text-[var(--short)] border-[var(--short)]/30 bg-[var(--short)]/5",
    caution: "text-[var(--caution)] border-[var(--caution)]/30 bg-[var(--caution)]/10",
    muted: "text-[var(--text-muted)] border-[var(--border)]",
  }[tone];
  return <span className={cn("inline-block text-xs font-mono px-1.5 py-0.5 border", cls)}>{children}</span>;
}

export function Stat({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className={cn("font-mono tabular-nums text-sm text-[var(--text-primary)]", className)}>{value}</dd>
    </div>
  );
}
