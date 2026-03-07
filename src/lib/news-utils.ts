const SOURCE_LABELS: Record<string, string> = {
  seekingalpha: "Seeking Alpha",
  yahoo: "Yahoo Finance",
  reuters: "Reuters",
  bloomberg: "Bloomberg",
  marketwatch: "MarketWatch",
  benzinga: "Benzinga",
  thestreet: "TheStreet",
  investing: "Investing.com",
  financialpost: "Financial Post",
  ft: "Financial Times",
};

export function formatSource(source: string): string {
  return (
    SOURCE_LABELS[source.toLowerCase()] ??
    source.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function relativeTime(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatAbsoluteDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
