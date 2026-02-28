"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppStore {
  apiBaseUrl: string;
  apiKey: string | null;
  llmKey: string | null;
  activeSessionId: string | null;
  resultsPerPage: number;
  defaultRefresh: boolean;
  setApiBaseUrl: (url: string) => void;
  setApiKey: (key: string | null) => void;
  setLlmKey: (key: string | null) => void;
  setActiveSession: (id: string | null) => void;
  setResultsPerPage: (n: number) => void;
  setDefaultRefresh: (v: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
      apiKey: null,
      llmKey: null,
      activeSessionId: null,
      resultsPerPage: 25,
      defaultRefresh: false,
      setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
      setApiKey: (key) => set({ apiKey: key }),
      setLlmKey: (key) => set({ llmKey: key }),
      setActiveSession: (id) => set({ activeSessionId: id }),
      setResultsPerPage: (n) => set({ resultsPerPage: n }),
      setDefaultRefresh: (v) => set({ defaultRefresh: v }),
    }),
    { name: "alphastream-config" }
  )
);
