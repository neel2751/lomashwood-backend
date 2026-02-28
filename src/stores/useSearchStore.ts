import { create } from "zustand";

interface SearchResult {
  id: string;
  label: string;
  type: "product" | "order" | "customer" | "appointment" | "blog";
  href: string;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isOpen: boolean;
  isLoading: boolean;
  recentSearches: string[];
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setIsOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  results: [],
  isOpen: false,
  isLoading: false,
  recentSearches: [],

  setQuery: (query) =>
    set({ query }),

  setResults: (results) =>
    set({ results }),

  setIsOpen: (isOpen) =>
    set({ isOpen }),

  setIsLoading: (isLoading) =>
    set({ isLoading }),

  addRecentSearch: (query) =>
    set((state) => ({
      recentSearches: [
        query,
        ...state.recentSearches.filter((s) => s !== query),
      ].slice(0, 8),
    })),

  clearRecentSearches: () =>
    set({ recentSearches: [] }),

  reset: () =>
    set({ query: "", results: [], isOpen: false, isLoading: false }),
}));