import React, { useEffect, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { useTimelineData } from '../../../../hooks/useTimelineData';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';
import { TimelineEntry } from './TimelineEntry';
import { TimelineLoading } from './TimelineLoading';
import { useAutoScrollSync } from '../../../../hooks/useAutoScrollSync';
import { useTranscriptSearch } from '../../../../hooks/useTranscriptSearch';

interface SmartTimelineProps {
  courseId: string;
  lectureId: string;
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
  isLiveMode?: boolean;
}

export const SmartTimeline: React.FC<SmartTimelineProps> = ({ courseId, lectureId, virtuosoRef, isLiveMode = false }) => {
  const { data, loading, error } = useTimelineData(courseId, lectureId, { skip: isLiveMode });
  const { nodes, setNodes, activeNodeId, userScrolled, setUserScrolled, searchQuery, searchResults, activeSearchResultIndex, isAutoScrollEnabled, enableAutoScroll } = useTimelineStore();
  
  // Search Engine
  useTranscriptSearch();

  // Attach auto-scroll sync logic
  const { onRangeChanged } = useAutoScrollSync(virtuosoRef);

  // Handle user scroll interruptions cleanly
  const handleUserInteraction = useCallback(() => {
    if (!userScrolled) {
      setUserScrolled(true);
    }
  }, [userScrolled, setUserScrolled]);

  // Orchestrate: Push fetched data into the isolated timeline store (Only for non-live initial load)
  useEffect(() => {
    if (!isLiveMode && data && data.length > 0) {
      setNodes(data);
    }
  }, [data, setNodes, isLiveMode]);

  // Live Mode Auto Scroll
  useEffect(() => {
    if (isLiveMode && isAutoScrollEnabled && !userScrolled && nodes.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: nodes.length - 1, align: 'end', behavior: 'smooth' });
    }
  }, [isLiveMode, isAutoScrollEnabled, userScrolled, nodes.length, virtuosoRef]);

  let content = null;

  if (loading && nodes.length === 0) {
    content = <TimelineLoading />;
  } else if (error) {
    content = <div style={{ color: 'red', padding: '1rem' }}>Error loading timeline: {error}</div>;
  } else if (nodes.length === 0) {
    content = isLiveMode ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted-foreground)', fontSize: '14px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.75 }} />
          Waiting for the teacher to speak...
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-muted-foreground)', opacity: 0.6 }}>
          Transcripts will appear here in real-time
        </p>
      </div>
    ) : (
      <div style={{ padding: '1rem' }}>No timeline data available.</div>
    );
  } else {
    content = (
      <div 
        style={{ height: '100%', width: '100%', position: 'relative' }}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
      >
        {isLiveMode && userScrolled && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => {
                enableAutoScroll();
                virtuosoRef.current?.scrollToIndex({ index: nodes.length - 1, align: 'end', behavior: 'smooth' });
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              Jump to Live
            </button>
          </div>
        )}
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%', width: '100%' }}
          data={nodes}
          overscan={200}
          rangeChanged={onRangeChanged}
          itemContent={(index, node) => {
            const isActiveSearchResult = searchResults.length > 0 && searchResults[activeSearchResultIndex] === index;

            return (
              <TimelineEntry 
                key={node.id}
                node={node} 
                isActive={node.id === activeNodeId} 
                searchQuery={searchQuery}
                isActiveSearchResult={isActiveSearchResult}
              />
            );
          }}
        />
      </div>
    );
  }

  return content;
};
