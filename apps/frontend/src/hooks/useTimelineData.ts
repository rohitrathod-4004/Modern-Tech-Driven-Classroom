import { useState, useEffect } from 'react';
import { api } from '../infrastructure/api';
import type { TimelineNode, PaginatedTimelineResponse } from '@classroom/shared';

interface UseTimelineDataReturn {
  data: TimelineNode[];
  loading: boolean;
  error: string | null;
}

export const useTimelineData = (courseId: string, lectureId: string): UseTimelineDataReturn => {
  const [data, setData] = useState<TimelineNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetching "all lite" pattern for Phase 2 immediate search/playback sync
        const res = await api.get<{ data: PaginatedTimelineResponse }>(
          `/api/courses/${courseId}/lectures/${lectureId}/timeline`,
          {
            params: { limit: 2000 }
          }
        );

        if (isMounted) {
          setData(res.data.data.nodes);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load timeline data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (courseId && lectureId) {
      fetchTimeline();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, lectureId]);

  return { data, loading, error };
};
