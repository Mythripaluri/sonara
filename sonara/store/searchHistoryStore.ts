import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_RECENT_SEARCHES = 12;

export type SearchHistoryState = {
  recentSearches: string[];
  isLoaded: boolean;
  recordSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recentSearches: [],
      isLoaded: false,
      recordSearch: (query: string) => {
        const cleaned = query.trim();
        if (!cleaned) return;

        set((state) => {
          const nextSearches = [
            cleaned,
            ...state.recentSearches.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
          ].slice(0, MAX_RECENT_SEARCHES);

          return { recentSearches: nextSearches };
        });
      },
      removeSearch: (query: string) => {
        const cleaned = query.trim();
        if (!cleaned) return;

        set((state) => ({
          recentSearches: state.recentSearches.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
        }));
      },
      clearSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "search-history-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
        }
      },
    },
  ),
);
