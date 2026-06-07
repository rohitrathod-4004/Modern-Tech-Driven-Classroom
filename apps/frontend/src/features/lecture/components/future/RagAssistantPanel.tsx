import React, { useState } from 'react';
import { api } from '../../../../infrastructure/api';
import { useParams } from 'react-router-dom';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';

export const RagAssistantPanel: React.FC = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [question, setQuestion] = useState('');
  const [answerData, setAnswerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState<string>('pending');
  const [isRetrying, setIsRetrying] = useState(false);
  const seekTo = useTimelineStore((state) => state.seekTo);

  const fetchStatus = async () => {
    try {
      const res = await api.get(`/api/lectures/${lectureId}/summary`); // Has aiStatus
      setAiStatus(res.data.data.aiStatus);
    } catch (err) { }
  };

  React.useEffect(() => {
    fetchStatus();
  }, [lectureId]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await api.post(`/api/admin/lectures/${lectureId}/reprocess-ai`);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to retry', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswerData(null);

    try {
      const res = await api.post(`/api/lectures/${lectureId}/ask`, { question });
      setAnswerData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to ask AI');
    } finally {
      setLoading(false);
    }
  };

  if (aiStatus === 'failed') {
    return (
      <div className="p-6 border border-destructive/20 rounded-xl bg-destructive/10">
        <h3 className="mb-2 text-destructive font-semibold">AI Assistant Failed</h3>
        <p className="mb-4 text-sm text-destructive/80">
          The assistant could not be initialized for this lecture.
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

  return (
    <div className="p-6 border border-border rounded-xl bg-card shadow-sm text-card-foreground">
      <h3 className="mb-4 font-semibold tracking-tight">AI Lecture Assistant</h3>
      
      <form onSubmit={handleAsk} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this lecture..."
          className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !question.trim()}
          className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </form>

      {error && <div className="mb-4 text-sm font-medium text-destructive">{error}</div>}

      {answerData && (
        <div className="p-4 border border-border bg-muted/50 rounded-lg">
          <p className="m-0 mb-4 text-sm text-foreground leading-relaxed">
            {answerData.answer}
          </p>
          
          {answerData.citations && answerData.citations.length > 0 && (
            <div>
              <strong className="block mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sources:</strong>
              <div className="flex flex-wrap gap-2">
                {answerData.citations.map((c: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => seekTo(c.startTime)}
                    className="inline-flex items-center px-2 py-1 border border-border bg-background rounded hover:border-primary/50 text-xs font-medium text-primary transition-colors"
                  >
                    {Math.floor(c.startTime / 60)}:{(c.startTime % 60).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
