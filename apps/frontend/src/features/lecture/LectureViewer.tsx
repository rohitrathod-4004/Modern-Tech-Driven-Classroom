import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../infrastructure/api';
import type { VirtuosoHandle } from 'react-virtuoso';
import { useTimelineStore } from '../../infrastructure/stores/timelineStore';

import { LectureHeader } from './components/LectureHeader';
import { MediaContainer } from './components/MediaContainer';
import { TimelineContainer } from './components/timeline/TimelineContainer';
import { LectureSidebar } from './components/LectureSidebar';
import { LectureLoadingShell } from './components/LectureLoadingShell';
import { EmptyLectureState } from './components/EmptyLectureState';
import { LectureProcessingState } from './components/LectureProcessingState';
import { LectureDesktopLayout } from './layout/LectureDesktopLayout';
import { LectureMobileLayout } from './layout/LectureMobileLayout';

export const LectureViewer: React.FC = () => {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchParams] = useSearchParams();
  const seekTo = useTimelineStore(state => state.seekTo);

  // Handle deep-linking ?t= parameter
  useEffect(() => {
    const t = searchParams.get('t');
    if (t) {
      const parsedTime = parseFloat(t);
      if (!isNaN(parsedTime) && parsedTime >= 0) {
        seekTo(parsedTime);
      }
    }
  }, [searchParams, seekTo]);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLectureMeta = async () => {
    try {
      const res = await api.get(`/api/courses/${courseId}/lectures/${lectureId}`);
      setLecture(res.data.data.lecture);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized');
      } else {
        setError(err.response?.data?.error || 'Failed to load lecture metadata');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && lectureId) {
      fetchLectureMeta();
    }
  }, [courseId, lectureId]);

  // Polling for AI Processing
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (lecture && (lecture.status === 'recording' || lecture.status === 'transcribing' || lecture.status === 'ai_processing')) {
      intervalId = setInterval(() => {
        if (courseId && lectureId) fetchLectureMeta();
      }, 5000); // Poll every 5s while processing
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [lecture?.status, courseId, lectureId]);

  if (loading) return <LectureLoadingShell />;

  if (error === 'Unauthorized') {
    return <EmptyLectureState title="Access Denied" description="You do not have permission to view this lecture." />;
  }

  if (error || !lecture || !courseId || !lectureId) {
    return <EmptyLectureState title="Lecture Unavailable" description={error || "This lecture could not be found."} />;
  }

  if (lecture.status === 'recording' || lecture.status === 'transcribing' || lecture.status === 'ai_processing') {
    return (
      <div className="h-full flex flex-col bg-background">
        <LectureHeader lecture={lecture} />
        <div className="flex-1 overflow-y-auto p-4">
          <LectureProcessingState lecture={lecture} onRefresh={fetchLectureMeta} />
        </div>
      </div>
    );
  }

  const Layout = isMobile ? LectureMobileLayout : LectureDesktopLayout;

  return (
    <Layout
      header={<LectureHeader lecture={lecture} />}
      media={<MediaContainer audioUrl={`/api/audio/${lectureId}`} />}
      sidebar={<LectureSidebar />}
      timeline={<TimelineContainer courseId={courseId} lectureId={lectureId} virtuosoRef={virtuosoRef} />}
    />
  );
};
