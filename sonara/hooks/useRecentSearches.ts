import { useCallback } from "react";
import { useSearchHistoryStore } from "../store/searchHistoryStore";

export const useRecentSearches = () => {
  const store = useSearchHistoryStore();

  const recordSearch = useCallback(
    (query: string) => {
      store.recordSearch(query);
    },
    [store],
  );

  const removeSearch = useCallback(
    (query: string) => {
      store.removeSearch(query);
    },
    [store],
  );

  const clearSearches = useCallback(() => {
    store.clearSearches();
  }, [store]);

  return {
    recentSearches: store.recentSearches,
    isLoaded: store.isLoaded,
    recordSearch,
    removeSearch,
    clearSearches,
  };
};
