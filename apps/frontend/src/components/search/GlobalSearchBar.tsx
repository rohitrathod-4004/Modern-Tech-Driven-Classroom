import React, { useState, useEffect, useRef } from 'react';
import { Search, Book, Mic, Hash, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../../infrastructure/stores/searchStore';
import type { SearchResultDto } from '@classroom/shared';
import { cn } from '../../design-system/utils';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export const GlobalSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { results, isLoading, isOpen, setIsOpen, search, clearSearch } = useSearchStore();

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      search(debouncedQuery);
    } else {
      clearSearch();
    }
  }, [debouncedQuery, search, clearSearch]);

  useEffect(() => {
    setSelectedIndex(-1); // Reset selection on new results
  }, [results]);

  useEffect(() => {
    // Click away listener
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSearch();
    };
  }, [clearSearch]);

  const handleResultClick = (result: SearchResultDto) => {
    setIsOpen(false);
    setQuery('');
    clearSearch();
    
    if (result.type === 'lecture' || result.type === 'topic') {
      navigate(`/courses/${result.courseId}/lectures/${result.lectureId}${result.timestamp !== undefined ? `?t=${result.timestamp}` : ''}`);
    } else if (result.type === 'transcript') {
      navigate(`/courses/${result.courseId}/lectures/${result.lectureId}?t=${result.timestamp}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : prev;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleResultClick(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!listboxRef.current) return;
    const elements = listboxRef.current.querySelectorAll('[role="option"]');
    if (elements[index]) {
      (elements[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  const categorizedResults = {
    lecture: results.filter(r => r.type === 'lecture'),
    topic: results.filter(r => r.type === 'topic'),
    transcript: results.filter(r => r.type === 'transcript')
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'lecture': return <Book className="h-4 w-4 text-blue-500" />;
      case 'topic': return <Hash className="h-4 w-4 text-emerald-500" />;
      case 'transcript': return <Mic className="h-4 w-4 text-purple-500" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  let globalIndex = 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search lectures, topics, or transcripts..."
          className="w-full h-10 pl-10 pr-10 rounded-md border border-border/40 bg-background text-[13px] transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 placeholder:text-muted-foreground/70"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              clearSearch();
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div 
          className="absolute top-12 left-0 w-full max-h-[400px] overflow-y-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border border-border/40 rounded-lg shadow-xl shadow-black/20 z-50 p-1.5 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
          ref={listboxRef}
        >
          {isLoading && results.length === 0 ? (
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No results found for "{query}"
            </div>
          ) : (
            <div className="flex flex-col">
              {['lecture', 'topic', 'transcript'].map((catKey) => {
                const catResults = categorizedResults[catKey as keyof typeof categorizedResults];
                if (catResults.length === 0) return null;

                return (
                  <div key={catKey} className="mb-2 last:mb-0">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {catKey === 'lecture' ? 'Lectures' : catKey === 'topic' ? 'Topics' : 'Transcripts'}
                    </div>
                    {catResults.map((result) => {
                      const currentIndex = globalIndex++;
                      const isSelected = selectedIndex === currentIndex;

                      return (
                        <div
                          key={result.id}
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "flex flex-col gap-0.5 px-3 py-2 cursor-pointer transition-colors rounded-md select-none",
                            isSelected ? "bg-secondary/40 text-foreground" : "hover:bg-secondary/20 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getResultIcon(result.type)}
                            <span className={cn("text-[13px] font-medium", isSelected ? "text-foreground" : "text-foreground/90")}>{result.title}</span>
                            {result.timestamp !== undefined && (
                              <span className="text-[10px] text-muted-foreground ml-auto bg-secondary/30 px-1.5 py-0.5 rounded font-mono">
                                {Math.floor(result.timestamp / 60)}:{String(Math.floor(result.timestamp % 60)).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          {result.preview && (
                            <p 
                              className={cn("text-[11px] line-clamp-2 pl-6", isSelected ? "text-muted-foreground" : "text-muted-foreground/60")}
                              dangerouslySetInnerHTML={{ __html: result.preview }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
