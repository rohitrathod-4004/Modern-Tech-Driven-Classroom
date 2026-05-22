import React, { useEffect } from 'react';
import { useTimelineStore } from '../infrastructure/stores/timelineStore';
import { useDebounce } from './useDebounce';
import { buildSearchIndex } from '../features/lecture/utils/searchIndexer';

export const useTranscriptSearch = () => {
  const nodes = useTimelineStore(state => state.nodes);
  const searchQuery = useTimelineStore(state => state.searchQuery);
  const setSearchResults = useTimelineStore(state => state.setSearchResults);
  const clearSearch = useTimelineStore(state => state.clearSearch);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchIndex = React.useMemo(() => {
    if (nodes.length > 0) {
      return buildSearchIndex(nodes);
    }
    return [];
  }, [nodes]);

  // Execute search when debounced query changes
  useEffect(() => {
    const query = debouncedQuery.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!query) {
      setSearchResults([]);
      return;
    }

    // O(n) scan against the pre-computed index array. 
    // This is extremely fast even for 10k items.
    const results: number[] = [];
    for (let i = 0; i < searchIndex.length; i++) {
      if (searchIndex[i].includes(query)) {
        results.push(i);
      }
    }

    setSearchResults(results);
  }, [debouncedQuery, searchIndex, setSearchResults]);

  return { clearSearch };
};
