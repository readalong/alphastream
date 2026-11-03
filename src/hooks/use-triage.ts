"use client";

/**
 * Shared triage-queue state (docs/ux-plan-20260719.md §3.1/§3.3). One hook
 * builds the grouped queue, one hook tracks "mark done" — every consumer
 * (the /today page, nav badges, eventually the context-line alert chip)
 * reads the same two hooks so counts can never drift from what the queue
 * actually shows.
 */

import { useEffect, useMemo, useState } from "react";
import { useDigest } from "@/hooks/use-digest";
import { useBook } from "@/hooks/use-desk";
import { groupByTicker, triageFromBook, triageFromDigest, type TriageGroup } from "@/lib/triage";

export function useMarkedDone(digestDate: string | undefined) {
  const storageKey = digestDate ? `alphastream-today-done-${digestDate}` : null;
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setDone(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setDone(new Set());
    }
  }, [storageKey]);

  const markDone = (groupId: string) => {
    if (!storageKey) return;
    setDone((prev) => {
      const next = new Set(prev);
      next.add(groupId);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* private mode etc. — the day just won't persist */
      }
      return next;
    });
  };

  return { done, markDone };
}

/** Stable per-group done-key: the sorted, joined ids of its items. */
export function groupDoneKey(group: TriageGroup): string {
  return group.items
    .map((i) => i.id)
    .sort()
    .join("|");
}

export function useTriageGroups() {
  const { data: digest, isLoading: digestLoading } = useDigest();
  // The open book comes from the ledger (setups.json), not the recommendations
  // engine's positions file, which was empty while the ledger held 30 rows.
  const { data: book } = useBook();

  const groups = useMemo(() => {
    if (!digest) return [];
    const items = [...triageFromDigest(digest), ...triageFromBook(book)];
    return groupByTicker(items);
  }, [digest, book]);

  return {
    digest,
    digestDate: digest?.session_date ?? digest?.date,
    groups,
    isLoading: digestLoading,
  };
}

/** Open (not-yet-done) ACT counts, split out for nav badges (plan §3.3). */
export function useTriageCounts() {
  const { digestDate, groups } = useTriageGroups();
  const { done } = useMarkedDone(digestDate);

  return useMemo(() => {
    const openActGroups = groups.filter((g) => g.severity === "act" && !done.has(groupDoneKey(g)));
    const bookActGroups = openActGroups.filter((g) =>
      g.items.some((i) => i.source === "book")
    );
    return {
      actOpenCount: openActGroups.length,
      bookActOpenCount: bookActGroups.length,
    };
  }, [groups, done]);
}
