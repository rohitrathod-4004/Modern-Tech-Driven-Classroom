import { create } from 'zustand';
import { api } from '../api';
import type { SearchResultDto } from '@classroom/shared';

interface SearchState {
  results: SearchResultDto[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;

  // Cache
  cache: Map<string, SearchResultDto[]>;
  abortController: AbortController | null;

  setIsOpen: (isOpen: boolean) => void;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  isLoading: false,
  error: null,
  isOpen: false,
  cache: new Map(),
  abortController: null,

  setIsOpen: (isOpen) => set({ isOpen }),

  search: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ results: [], isLoading: false, isOpen: false });
      return;
    }

    const trimmedQuery = query.trim();

    // Check cache
    const { cache, abortController } = get();
    if (cache.has(trimmedQuery)) {
      if (abortController) abortController.abort(); // Cancel pending network req if we hit cache
      set({ results: cache.get(trimmedQuery)!, isLoading: false, isOpen: true, error: null });
      return;
    }

    // Abort previous fetch
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    set({ isLoading: true, isOpen: true, error: null, abortController: newAbortController });

    try {
      const { data } = await api.get(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: newAbortController.signal
      });
      
      const newResults = data.data || [];
      
      // Update cache
      const newCache = new Map(get().cache);
      newCache.set(trimmedQuery, newResults);

      set({ results: newResults, isLoading: false, cache: newCache });
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        // Ignored, fetch aborted
        return;
      }
      set({ error: err.response?.data?.error || 'Search failed', isLoading: false });
    }
  },

  clearSearch: () => {
    const { abortController } = get();
    if (abortController) abortController.abort();
    set({ results: [], isLoading: false, isOpen: false, error: null });
  }
}));
