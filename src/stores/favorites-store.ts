"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteEntry {
  ticker: string;
  sector: string;
  sectorEtf: string;
  addedAt: number;
}

interface FavoritesStore {
  favorites: FavoriteEntry[];
  addFavorite: (ticker: string, sector: string, sectorEtf: string) => void;
  removeFavorite: (ticker: string) => void;
  toggleFavorite: (ticker: string, sector: string, sectorEtf: string) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (ticker, sector, sectorEtf) =>
        set((state) => {
          if (state.favorites.some((f) => f.ticker === ticker)) return state;
          return {
            favorites: [
              ...state.favorites,
              { ticker, sector, sectorEtf, addedAt: Date.now() },
            ],
          };
        }),
      removeFavorite: (ticker) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.ticker !== ticker),
        })),
      toggleFavorite: (ticker, sector, sectorEtf) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.some((f) => f.ticker === ticker)) {
          removeFavorite(ticker);
        } else {
          addFavorite(ticker, sector, sectorEtf);
        }
      },
    }),
    { name: "alphastream-favorites" }
  )
);
