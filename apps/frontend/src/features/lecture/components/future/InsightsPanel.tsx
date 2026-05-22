import React, { useEffect, useState } from 'react';
import { api } from '../../../../infrastructure/api';
import { useParams } from 'react-router-dom';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';
import { BookOpen, Clock } from 'lucide-react';
import { cn } from '../../../../design-system/utils';

export const InsightsPanel: React.FC = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const seekTo = useTimelineStore((state) => state.seekTo);

  const fetchTopics = async () => {
    try {
      const res = await api.get(`/api/lectures/${lectureId}/topics`);
      setData(res.data.data);
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) fetchTopics();
  }, [lectureId]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await api.post(`/api/admin/lectures/${lectureId}/reprocess-ai`);
      await fetchTopics();
    } catch (err) {
      console.error('Failed to retry', err);
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) return (
    <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
      <div className="flex items-center mb-6">
        <div className="w-5 h-5 bg-muted animate-pulse rounded-full mr-2"></div>
        <div className="h-5 w-1/3 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0 mt-1"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-1/4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-full bg-muted animate-pulse rounded mt-2"></div>
              <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (!data) return null;

  if (data.aiStatus === 'failed') {
    return (
      <div className="p-6 border border-destructive/20 rounded-xl bg-destructive/10">
        <h3 className="mb-2 text-destructive font-semibold">AI Topics Failed</h3>
        <p className="mb-4 text-sm text-destructive/80">
          We could not extract topics for this lecture.
        </p>
        <button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
        >
          {isRetrying ? 'Retrying...' : 'Retry Processing'}
        </button>
      </div>
    );
  }

  if (!data.topics || data.topics.length === 0) {
    return (
      <div className="p-4 border border-border rounded-xl bg-card text-muted-foreground text-sm">
        <p>AI is currently processing topics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow text-card-foreground">
      <h3 className="mb-6 font-bold text-lg flex items-center tracking-tight">
        <BookOpen className="w-5 h-5 mr-2 text-primary" />
        Semantic Chapters
      </h3>
      
      <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-border/20 before:via-border before:to-border/20 flex flex-col gap-6 pl-2">
        {data.topics.map((topic: any, idx: number) => (
          <div 
            key={topic.id}
            onClick={() => seekTo(topic.startTime)}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group cursor-pointer"
          >
            {/* Timeline marker */}
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full border-2 border-background bg-border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:bg-primary group-hover:border-primary/30 transition-colors z-10",
              idx === 0 ? "bg-primary text-primary-foreground border-primary/30" : "text-muted-foreground"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full bg-current", idx === 0 ? "bg-primary-foreground" : "")} />
            </div>
            
            {/* Chapter Card */}
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-border bg-surface hover:border-primary/50 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm font-semibold text-foreground leading-tight">{topic.title}</strong>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mb-2 font-mono bg-background/50 inline-flex px-2 py-1 rounded-md">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor(topic.startTime / 60)}:{(topic.startTime % 60).toString().padStart(2, '0')}
              </div>
              {topic.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">{topic.summary}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
