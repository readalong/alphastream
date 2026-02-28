import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function parseCategory(category: string): string {
  return category.trim();
}

export function parseStageNumber(stage: string): string {
  // Extract the stage number/code from strings like "Stage 2: Confirmed Uptrend"
  const match = stage.match(/Stage\s+(\d+[A-Z]?)/i);
  if (match) return match[1];
  // Check for category codes directly
  if (["S", "B", "A", "X", "0", "1", "1D", "2", "3", "4"].includes(stage)) return stage;
  return stage;
}

export function parseSignals(signals: string): string[] {
  if (!signals) return [];
  return signals
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse session_id to display date.
 * Handles both YYYYMMDD (new daily) and YYYYMMDD_HHMM (legacy) formats.
 */
export function formatSessionDate(sessionId: string): string {
  if (/^\d{8}$/.test(sessionId)) {
    const year = sessionId.slice(0, 4);
    const month = sessionId.slice(4, 6);
    const day = sessionId.slice(6, 8);
    return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  if (/^\d{8}_\d{4}$/.test(sessionId)) {
    const year = sessionId.slice(0, 4);
    const month = sessionId.slice(4, 6);
    const day = sessionId.slice(6, 8);
    const hour = sessionId.slice(9, 11);
    const min = sessionId.slice(11, 13);
    return new Date(`${year}-${month}-${day}T${hour}:${min}`).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return sessionId;
}

export function isTodaySession(sessionId: string): boolean {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return sessionId === today;
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
