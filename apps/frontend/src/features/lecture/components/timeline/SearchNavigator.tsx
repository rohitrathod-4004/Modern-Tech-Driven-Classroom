import React, { useEffect, useRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';

interface SearchNavigatorProps {
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
}

export const SearchNavigator: React.FC<SearchNavigatorProps> = ({ virtuosoRef }) => {
  const searchQuery = useTimelineStore(state => state.searchQuery);
  const setSearchQuery = useTimelineStore(state => state.setSearchQuery);
  const searchResults = useTimelineStore(state => state.searchResults);
  const activeSearchResultIndex = useTimelineStore(state => state.activeSearchResultIndex);
  const nextSearchResult = useTimelineStore(state => state.nextSearchResult);
  const previousSearchResult = useTimelineStore(state => state.previousSearchResult);
  const clearSearch = useTimelineStore(state => state.clearSearch);
  const setUserScrolled = useTimelineStore(state => state.setUserScrolled);

  const inputRef = useRef<HTMLInputElement>(null);

  // Jump to result when activeSearchResultIndex changes
  useEffect(() => {
    if (searchResults.length > 0 && virtuosoRef.current) {
      const targetIndex = searchResults[activeSearchResultIndex];
      // Pauses auto-follow temporarily when user is searching
      setUserScrolled(true);
      virtuosoRef.current.scrollToIndex({
        index: targetIndex,
        align: 'center',
        behavior: 'smooth'
      });
    }
  }, [activeSearchResultIndex, searchResults, virtuosoRef, setUserScrolled]);

  return (
    <div className="p-4 border-b border-border bg-card flex gap-4 items-center shrink-0">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 text-sm rounded-md border border-input bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>
      
      {searchQuery && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          {searchResults.length > 0 ? (
            <>
              <span className="font-medium">{activeSearchResultIndex + 1} / {searchResults.length}</span>
              <button 
                onClick={previousSearchResult} 
                className="p-1 rounded-sm hover:bg-surfaceHover text-foreground transition-colors"
                aria-label="Previous result"
              >
                ↑
              </button>
              <button 
                onClick={nextSearchResult} 
                className="p-1 rounded-sm hover:bg-surfaceHover text-foreground transition-colors"
                aria-label="Next result"
              >
                ↓
              </button>
            </>
          ) : (
            <span>0 results</span>
          )}
          <button 
            onClick={() => { clearSearch(); inputRef.current?.focus(); }} 
            className="ml-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
