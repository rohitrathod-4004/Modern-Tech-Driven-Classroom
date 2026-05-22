import React, { useEffect, useState } from 'react';
import { api } from '../../../../infrastructure/api';
import { useParams } from 'react-router-dom';

export const SummaryPanel: React.FC = () => {
  const { lectureId } = useParams<{ courseId: string, lectureId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/api/lectures/${lectureId}/summary`);
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    if (lectureId) fetchSummary();
  }, [lectureId]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await api.post(`/api/admin/lectures/${lectureId}/reprocess-ai`);
      // Since fetchSummary is now inside the effect, we can just do a direct fetch or trigger a reload.
      // Easiest is to manually inline the refetch for the retry button:
      const res = await api.get(`/api/lectures/${lectureId}/summary`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to retry', err);
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) return (
    <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
      <div className="h-5 w-1/3 bg-muted animate-pulse rounded mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-4/6 bg-muted animate-pulse rounded"></div>
      </div>
    </div>
  );
  if (error) return null; // Gracefully hide if failing

  const { summary, aiStatus } = data;

  if (aiStatus === 'failed') {
    return (
      <div className="p-6 border border-destructive/20 rounded-xl bg-destructive/10">
        <h3 className="mb-2 text-destructive font-semibold">AI Processing Failed</h3>
        <p className="mb-4 text-sm text-destructive/80">
          We encountered an issue while generating the summary for this lecture.
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

  if (!summary) {
    return (
      <div className="p-4 border border-border rounded-xl bg-card text-muted-foreground text-sm">
        <p>AI is currently processing this lecture...</p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow text-card-foreground">
      <h3 className="mb-3 font-semibold tracking-tight text-lg">AI Summary</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {summary.short}
      </p>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {summary.detailed}
          </p>
        </div>
      )}

      <button 
        onClick={() => setExpanded(!expanded)}
        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors flex items-center gap-1"
      >
        {expanded ? 'Show Less' : 'Read Detailed Summary'}
      </button>
    </div>
  );
};
