"use client";

interface NoDataPlaceholderProps {
  message: string;
}

export function NoDataPlaceholder({ message }: NoDataPlaceholderProps) {
  return (
    <div className="flex items-center justify-center py-8 text-center">
      <div>
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--border)] mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
      </div>
    </div>
  );
}
