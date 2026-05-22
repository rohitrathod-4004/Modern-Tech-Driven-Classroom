import { useEffect, useRef } from 'react';
import { useTimelineStore } from '../infrastructure/stores/timelineStore';
import { findActiveChunkIndex } from '../features/lecture/components/timeline/playback/binarySearch';

/**
 * High-performance hook managing the requestAnimationFrame loop to sync audio playback to the timeline.
 */
export const usePlaybackSync = (mediaElementRef: React.RefObject<HTMLMediaElement | null>) => {
  const reqRef = useRef<number | null>(null);
  
  // Directly extract methods without subscribing to constantly changing state arrays
  const nodes = useTimelineStore(state => state.nodes);
  const setActiveNode = useTimelineStore(state => state.setActiveNode);
  const setPlaybackTime = useTimelineStore(state => state.setPlaybackTime);

  useEffect(() => {
    const media = mediaElementRef.current;
    if (!media) return;

    const syncLoop = () => {
      if (!media.paused && !media.ended) {
        const currentTime = media.currentTime;
        
        // 1. O(log N) fast lookup
        const activeIndex = findActiveChunkIndex(nodes, currentTime);
        
        // 2. Strict store update boundary (Zustand will block re-renders if unchanged)
        if (activeIndex !== -1) {
          setActiveNode(nodes[activeIndex].id, activeIndex);
        } else {
          setActiveNode(null, -1);
        }

        // Keep global time updated for future UI needs
        setPlaybackTime(currentTime);

        reqRef.current = requestAnimationFrame(syncLoop);
      }
    };

    const handlePlay = () => {
      reqRef.current = requestAnimationFrame(syncLoop);
    };

    const handlePause = () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };

    // Attach listeners
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('seeked', syncLoop); // instantly update on seek

    return () => {
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('seeked', syncLoop);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [mediaElementRef, nodes, setActiveNode, setPlaybackTime]);
};
