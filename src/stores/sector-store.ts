"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SectorStore {
  selectedSector: string | null;
  selectedIndustry: string | null;
  setSelectedSector: (etf: string | null) => void;
  setSelectedIndustry: (industry: string | null) => void;
  clearFilters: () => void;
}

export const useSectorStore = create<SectorStore>()(
  persist(
    (set) => ({
      selectedSector: null,
      selectedIndustry: null,
      setSelectedSector: (etf) =>
        set({ selectedSector: etf, selectedIndustry: null }),
      setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
      clearFilters: () =>
        set({ selectedSector: null, selectedIndustry: null }),
    }),
    { name: "alphastream-sector" }
  )
);
