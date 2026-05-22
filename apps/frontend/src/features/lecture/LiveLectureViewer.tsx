import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../../infrastructure/stores/courseStore';
import { useTimelineStore } from '../../infrastructure/stores/timelineStore';
import { SmartTimeline } from './components/timeline/SmartTimeline';
import { useLiveTranscriptPolling } from './hooks/useLiveTranscriptPolling';
import { api } from '../../infrastructure/api';
import { ArrowLeft, Radio, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { VirtuosoHandle } from 'react-virtuoso';

export function LiveLectureViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { activeCourse, fetchCourseById, courses } = useCourseStore();
  const { setNodes, appendNodes, nodes } = useTimelineStore();
  
  const [liveLectureId, setLiveLectureId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lectureEnded, setLectureEnded] = useState<boolean>(false);
  const [lectureTitle, setLectureTitle] = useState<string>('Live Session');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const pollingRetryRef = useRef<NodeJS.Timeout | null>(null);
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Initialize and check status
  useEffect(() => {
    if (!courseId) return;
    
    // Ensure course metadata is loaded
    if (!courses.find(c => c.id === courseId)) {
      fetchCourseById(courseId);
    }

    // Cleanup nodes on mount to ensure clean slate
    setNodes([]);

    const checkLiveStatus = async () => {
      try {
        const { data } = await api.get(`/api/courses/${courseId}/live-status`);
        const liveData = data.data;
        if (liveData) {
          setLiveLectureId(liveData._id);
          setLectureTitle(liveData.title);
          setStartTime(new Date(liveData.startedAt));
          setIsLive(true);
          setLectureEnded(false);
        } else {
          setIsLive(false);
          // If we previously had a lecture ID but now it's gone, the lecture ended
          setLiveLectureId(prev => {
            if (prev) setLectureEnded(true);
            return prev; // Keep ID so concluded screen can display
          });
        }
      } catch (err) {
        console.error('Failed to fetch live status:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    checkLiveStatus();
    
    // Re-check every 5s while waiting for lecture to start (polling for "Waiting for Class")
    pollingRetryRef.current = setInterval(checkLiveStatus, 5000);
    
    return () => {
      if (pollingRetryRef.current) clearInterval(pollingRetryRef.current);
      setNodes([]);
    };
  }, [courseId, fetchCourseById, courses, setNodes]);

  // Once live is detected, stop the status-check interval (the polling hook takes over)
  useEffect(() => {
    if (isLive && pollingRetryRef.current) {
      clearInterval(pollingRetryRef.current);
      pollingRetryRef.current = null;
    }
  }, [isLive]);

  // Duration timer
  useEffect(() => {
    if (!isLive || !startTime) return;
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, startTime]);

  // Polling hook orchestration
  const handleNewChunks = useCallback((newNodes: any[]) => {
    // Filter out empty-text nodes to avoid blank entries in live timeline
    const validNodes = newNodes.filter(n => n.text && n.text.trim().length > 0);
    if (validNodes.length > 0) {
      appendNodes(validNodes);
    }
  }, [appendNodes]);

  const handleLectureEnded = useCallback(() => {
    setIsLive(false);
    setLectureEnded(true);
  }, []);

  const { error: pollingError } = useLiveTranscriptPolling({
    courseId: courseId!,
    lectureId: liveLectureId,
    isActive: isLive,
    onNewChunks: handleNewChunks,
    onLectureEnded: handleLectureEnded
  });

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <Radio className="w-8 h-8 text-blue-500 mb-4" />
          <p className="text-muted-foreground font-medium">Connecting to classroom...</p>
        </div>
      </div>
    );
  }

  // Graceful Empty / Ended State — Waiting for teacher to start
  if (!isLive && !lectureEnded) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background p-8 items-center justify-center">
        <div className="bg-surface border border-border/40 p-8 rounded-2xl max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Waiting for Class</h2>
          <p className="text-muted-foreground text-sm mb-6">
            The teacher hasn't started the live lecture yet. This page will automatically update when the broadcast begins.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-8">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Checking for live session every 5 seconds...</span>
          </div>
          <button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-6 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 font-medium rounded-xl transition-colors w-full"
          >
            Return to Course Hub
          </button>
        </div>
      </div>
    );
  }

  // Finalizing State (Lecture Just Ended)
  if (lectureEnded) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background p-8 items-center justify-center">
        <div className="bg-surface border border-border/40 p-8 rounded-2xl max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Lecture Concluded</h2>
          <p className="text-muted-foreground text-sm mb-8">
            The live session has ended. The system is now finalizing the AI processing to generate summaries, topics, and study materials.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex-1 px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 font-medium rounded-xl transition-colors text-sm"
            >
              Course Hub
            </button>
            <button 
              onClick={() => navigate(`/courses/${courseId}/lectures/${liveLectureId}`)}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl transition-colors shadow-sm text-sm"
            >
              View Full Lecture
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Live State
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Cinematic ambient background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <header className="shrink-0 flex items-center justify-between px-8 py-5 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </div>
              {lectureTitle}
            </h1>
            <p className="text-[13px] text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
              <span>{activeCourse?.title || 'Loading course...'}</span>
              <span>•</span>
              <span className="text-blue-500 font-mono tracking-wider">{formatDuration(duration)}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-border/40 rounded-full text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {pollingError ? (
              <><AlertCircle className="w-3 h-3 text-amber-500" /> {pollingError}</>
            ) : (
              <><Radio className="w-3 h-3 text-emerald-500" /> Connected</>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {nodes.length} chunks received
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative z-10 p-6 flex justify-center">
        <div className="w-full max-w-4xl h-full bg-card/40 backdrop-blur-sm border border-border/40 rounded-2xl shadow-xl overflow-hidden">
          {courseId && liveLectureId ? (
            <SmartTimeline 
              courseId={courseId} 
              lectureId={liveLectureId} 
              virtuosoRef={virtuosoRef} 
              isLiveMode={true} 
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
