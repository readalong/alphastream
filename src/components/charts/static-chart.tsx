"use client";

interface StaticChartProps {
  base64: string;
  alt: string;
  className?: string;
}

export function StaticChart({ base64, alt, className }: StaticChartProps) {
  return (
    <img
      src={`data:image/png;base64,${base64}`}
      alt={alt}
      className={`w-full rounded-lg ${className || ""}`}
    />
  );
}
