"use client";

interface ScoreSparklineProps {
  data: number[];
  variant?: "leaders" | "exits";
  width?: number;
  height?: number;
}

export function ScoreSparkline({
  data,
  variant = "leaders",
  width = 80,
  height = 20,
}: ScoreSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const color = variant === "exits" ? "#ef4444" : "var(--accent)";

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible flex-shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}
