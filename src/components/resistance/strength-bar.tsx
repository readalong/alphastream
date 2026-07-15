"use client";

interface StrengthBarProps {
  strength: number;
  max?: number;
}

export function StrengthBar({ strength, max = 5 }: StrengthBarProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 w-2 rounded-sm"
          style={{
            backgroundColor:
              i < strength ? "var(--short)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}
