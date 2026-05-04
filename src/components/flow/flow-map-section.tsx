"use client";

interface FlowMapSectionProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function FlowMapSection({ title, children, loading }: FlowMapSectionProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
