"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewFilter = "all" | "has_resistance" | "at_ath";
type SortField = "r1_pct" | "price" | "ticker";
type SortDir = "asc" | "desc";

interface UptrendStore {
  viewFilter: ViewFilter;
  setViewFilter: (filter: ViewFilter) => void;
  sectorFilter: string | null;
  industryFilter: string | null;
  setSectorFilter: (etf: string | null) => void;
  setIndustryFilter: (industry: string | null) => void;
  clearFilters: () => void;
  sortBy: SortField;
  sortDirection: SortDir;
  setSortBy: (field: SortField) => void;
  toggleSortDirection: () => void;
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;
}

export const useUptrendStore = create<UptrendStore>()(
  persist(
    (set) => ({
      viewFilter: "all",
      setViewFilter: (filter) => set({ viewFilter: filter }),
      sectorFilter: null,
      industryFilter: null,
      setSectorFilter: (etf) =>
        set({ sectorFilter: etf, industryFilter: null }),
      setIndustryFilter: (industry) => set({ industryFilter: industry }),
      clearFilters: () =>
        set({
          viewFilter: "all",
          sectorFilter: null,
          industryFilter: null,
        }),
      sortBy: "r1_pct",
      sortDirection: "asc",
      setSortBy: (field) => set({ sortBy: field }),
      toggleSortDirection: () =>
        set((s) => ({
          sortDirection: s.sortDirection === "asc" ? "desc" : "asc",
        })),
      selectedTicker: null,
      setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
    }),
    { name: "alphastream-uptrend" }
  )
);
