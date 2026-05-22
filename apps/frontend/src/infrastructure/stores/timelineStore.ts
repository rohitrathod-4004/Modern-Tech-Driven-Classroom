import { create } from 'zustand';
import type { TimelineNode } from '@classroom/shared';

interface TimelineState {
  nodes: TimelineNode[];
  activeNodeId: string | null;
  activeNodeIndex: number;

  isAutoScrollEnabled: boolean;
  userScrolled: boolean;

  currentPlaybackTime: number;
  pendingSeekTime: number | null;

  // Search State Boundary
  searchQuery: string;
  searchResults: number[];
  activeSearchResultIndex: number;
  isSearching: boolean;

  setNodes: (nodes: TimelineNode[]) => void;
  setActiveNode: (id: string | null, index: number) => void;
  setPlaybackTime: (time: number) => void;
  seekTo: (time: number) => void;
  clearPendingSeek: () => void;

  enableAutoScroll: () => void;
  disableAutoScroll: () => void;

  setUserScrolled: (value: boolean) => void;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: number[]) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
  clearSearch: () => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  nodes: [],
  activeNodeId: null,
  activeNodeIndex: -1,

  isAutoScrollEnabled: true,
  userScrolled: false,

  currentPlaybackTime: 0,
  pendingSeekTime: null,

  searchQuery: '',
  searchResults: [],
  activeSearchResultIndex: 0,
  isSearching: false,

  setNodes: (nodes) => set({ nodes }),
  setActiveNode: (id, index) => set((state) => {
    // Only update if changed to avoid unnecessary Zustand subscribers triggering
    if (state.activeNodeId !== id) {
      return { activeNodeId: id, activeNodeIndex: index };
    }
    return state;
  }),
  setPlaybackTime: (time) => set({ currentPlaybackTime: time }),
  seekTo: (time) => set({ pendingSeekTime: time, isAutoScrollEnabled: true, userScrolled: false }),
  clearPendingSeek: () => set({ pendingSeekTime: null }),

  enableAutoScroll: () => set({ isAutoScrollEnabled: true, userScrolled: false }),
  disableAutoScroll: () => set({ isAutoScrollEnabled: false }),

  setUserScrolled: (value) => set({ userScrolled: value }),

  setSearchQuery: (query) => set({ searchQuery: query, isSearching: query.trim().length > 0 }),
  setSearchResults: (results) => set({ searchResults: results, activeSearchResultIndex: 0 }),
  nextSearchResult: () => set((state) => ({
    activeSearchResultIndex: state.searchResults.length > 0 
      ? (state.activeSearchResultIndex + 1) % state.searchResults.length 
      : 0
  })),
  previousSearchResult: () => set((state) => ({
    activeSearchResultIndex: state.searchResults.length > 0 
      ? (state.activeSearchResultIndex - 1 + state.searchResults.length) % state.searchResults.length 
      : 0
  })),
  clearSearch: () => set({ searchQuery: '', searchResults: [], activeSearchResultIndex: 0, isSearching: false }),
}));
