import { useEffect, useRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { useTimelineStore } from '../infrastructure/stores/timelineStore';
import { shouldAutoScroll } from '../features/lecture/components/timeline/interactions/scrollManager';

export const useAutoScrollSync = (virtuosoRef: React.RefObject<VirtuosoHandle | null>) => {
  const activeNodeIndex = useTimelineStore(state => state.activeNodeIndex);
  const isAutoScrollEnabled = useTimelineStore(state => state.isAutoScrollEnabled);
  const userScrolled = useTimelineStore(state => state.userScrolled);
  
  // Track visible range internally to avoid triggering React renders
  const visibleRangeRef = useRef({ startIndex: 0, endIndex: 0 });

  const onRangeChanged = (range: { startIndex: number; endIndex: number }) => {
    visibleRangeRef.current = range;
  };

  useEffect(() => {
    if (activeNodeIndex !== -1 && virtuosoRef.current) {
      const { startIndex, endIndex } = visibleRangeRef.current;
      
      if (shouldAutoScroll(activeNodeIndex, startIndex, endIndex, isAutoScrollEnabled, userScrolled)) {
        virtuosoRef.current.scrollToIndex({
          index: activeNodeIndex,
          align: 'center',
          behavior: 'smooth'
        });
      }
    }
  }, [activeNodeIndex, isAutoScrollEnabled, userScrolled, virtuosoRef]);

  return { onRangeChanged };
};
