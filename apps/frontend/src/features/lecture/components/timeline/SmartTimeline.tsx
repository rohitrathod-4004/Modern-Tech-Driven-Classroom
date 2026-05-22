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
}

export const SmartTimeline: React.FC<SmartTimelineProps> = ({ courseId, lectureId, virtuosoRef }) => {
  const { data, loading, error } = useTimelineData(courseId, lectureId);
  const { nodes, setNodes, activeNodeId, userScrolled, setUserScrolled, searchQuery, searchResults, activeSearchResultIndex } = useTimelineStore();
  
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

  // Orchestrate: Push fetched data into the isolated timeline store
  useEffect(() => {
    if (data && data.length > 0) {
      setNodes(data);
    }
  }, [data, setNodes]);

  let content = null;

  if (loading && nodes.length === 0) {
    content = <TimelineLoading />;
  } else if (error) {
    content = <div style={{ color: 'red', padding: '1rem' }}>Error loading timeline: {error}</div>;
  } else if (nodes.length === 0) {
    content = <div style={{ padding: '1rem' }}>No timeline data available.</div>;
  } else {
    content = (
      <div 
        style={{ height: '100%', width: '100%' }}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
      >
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
