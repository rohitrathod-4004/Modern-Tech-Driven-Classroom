import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../../infrastructure/api';
import type { TranscriptTimelineNode } from '@classroom/shared';

interface UseLiveTranscriptPollingProps {
  courseId: string;
  lectureId: string | null;
  isActive: boolean;
  onNewChunks: (chunks: TranscriptTimelineNode[]) => void;
  onLectureEnded: () => void;
}

export function useLiveTranscriptPolling({
  courseId,
  lectureId,
  isActive,
  onNewChunks,
  onLectureEnded
}: UseLiveTranscriptPollingProps) {
  const [error, setError] = useState<string | null>(null);
  const lastSequenceRef = useRef<number>(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const fetchLiveChunks = useCallback(async () => {
    if (!lectureId || !isActive || isFetchingRef.current) return;
    
    // Pause polling if tab is hidden to save resources
    if (document.visibilityState === 'hidden') {
      timeoutRef.current = setTimeout(fetchLiveChunks, 3000);
      return;
    }

    isFetchingRef.current = true;
    try {
      const { data } = await api.get(`/api/courses/${courseId}/lectures/${lectureId}/live-chunks`, {
        params: { afterSequence: lastSequenceRef.current }
      });

      const chunks = data.data as TranscriptTimelineNode[];

      if (chunks.length > 0) {
        // Update the sequence pointer to the highest received index
        const maxIndex = Math.max(...chunks.map(c => c.chunkIndex));
        lastSequenceRef.current = maxIndex;
        
        // Pass strictly ordered chunks up
        onNewChunks(chunks);
      }
      
      // Also check if lecture has ended while we were polling chunks
      try {
        const statusRes = await api.get(`/api/courses/${courseId}/live-status`);
        const liveData = statusRes.data.data;
        if (!liveData || liveData._id !== lectureId) {
          onLectureEnded();
          return; // Stop polling
        }
      } catch (e) {
        // Ignore status fetch error, rely on chunk fetch
      }

      setError(null);
    } catch (err: any) {
      console.error('[LivePolling] Error fetching chunks:', err);
      // Don't stop polling on temporary failure, just backoff
      setError('Connection issues. Retrying...');
    } finally {
      isFetchingRef.current = false;
      if (isActive) {
        timeoutRef.current = setTimeout(fetchLiveChunks, 3000);
      }
    }
  }, [courseId, lectureId, isActive, onNewChunks, onLectureEnded]);

  useEffect(() => {
    if (isActive && lectureId) {
      fetchLiveChunks();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isFetchingRef.current = false;
    };
  }, [isActive, lectureId, fetchLiveChunks]);

  return { error };
}
