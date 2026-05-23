import React, { useEffect, useState } from 'react';
import { api } from '../../infrastructure/api';
import { BrainCircuit, Clock, RefreshCw, AlertTriangle, FileText, Layout, Layers, Loader2, Activity, ArrowRight } from 'lucide-react';
import { cn } from '../../design-system/utils';
import { useNavigate } from 'react-router-dom';

export const AIWorkspace: React.FC = () => {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const fetchLectures = async () => {
    try {
      const res = await api.get('/api/lectures');
      // Sort by newest first
      const sorted = res.data.data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLectures(sorted);
    } catch (err) {
      console.error('Failed to fetch lectures', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
    
    // Simple polling to keep AI status fresh while in the workspace
    const interval = setInterval(fetchLectures, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (lectureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingIds(prev => new Set(prev).add(lectureId));
    try {
      await api.post(`/api/admin/lectures/${lectureId}/reprocess-ai`);
      await fetchLectures();
    } catch (err) {
      console.error('Failed to trigger AI reprocessing', err);
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(lectureId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string, rawAiStatus: string) => {
    if (status === 'recording' || status === 'transcribing') {
      return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-500 uppercase tracking-wide bg-blue-500/10 px-2 py-0.5 rounded-sm"><Loader2 className="w-3 h-3 animate-spin"/> Processing</span>;
    }
    
    // Handle legacy lectures that don't have an aiStatus but are fully processed
    const aiStatus = rawAiStatus || (['ready', 'completed'].includes(status) ? 'completed' : 'queued');

    switch (aiStatus) {
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded-sm">AI Ready</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-500 uppercase tracking-wide bg-red-500/10 px-2 py-0.5 rounded-sm"><AlertTriangle className="w-3 h-3"/> Failed</span>;
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-yellow-500 uppercase tracking-wide bg-yellow-500/10 px-2 py-0.5 rounded-sm">
            <Loader2 className="w-3 h-3 animate-spin"/> {aiStatus.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  if (loading && lectures.length === 0) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-muted-foreground animate-pulse">
        <BrainCircuit className="w-8 h-8 mb-4 opacity-50" />
        <p>Loading AI Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative overflow-x-hidden overflow-y-auto bg-background h-full flex flex-col">
      {/* Atmospheric Background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="flex items-center justify-between space-y-2 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Control Center
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Monitor background AI processing, asset generation, and model health across all lectures.</p>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface/50 animate-pulse rounded-xl border border-border/40"></div>
            ))}
          </div>
        ) : lectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card/30 backdrop-blur-sm border border-border/20 rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No processing history</h3>
            <p className="text-muted-foreground mt-2 max-w-[400px]">
              Record a new lecture to see its AI transcription and processing status here.
            </p>
          </div>
        ) : (
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur shadow-2xl overflow-hidden divide-y divide-border/40">
            {lectures.map((lecture) => {
              const aiStatus = lecture.aiStatus || (['ready', 'completed'].includes(lecture.status) ? 'completed' : 'queued');
              const isProcessing = ['summarizing', 'embedding', 'indexing', 'generating_study_materials'].includes(aiStatus) || lecture.status === 'transcribing';
              const isFailed = aiStatus === 'failed';
              
              return (
                <div 
                  key={lecture.id} 
                  onClick={() => navigate(`/courses/${lecture.courseId}/lectures/${lecture.id}`)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors duration-300"></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-[15px] font-medium truncate group-hover:text-primary transition-colors">
                        {lecture.title}
                      </h3>
                      {getStatusBadge(lecture.status, lecture.aiStatus)}
                    </div>
                    <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(lecture.createdAt).toLocaleString()}
                      </span>
                      {(lecture.aiStatus === 'completed' || isProcessing) && (
                        <span className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5" title="Summary generated"><FileText className="w-3.5 h-3.5 opacity-70"/> Summary</span>
                          <span className="flex items-center gap-1.5" title="Quiz generated"><Layout className="w-3.5 h-3.5 opacity-70"/> Quiz</span>
                          <span className="flex items-center gap-1.5" title="Flashcards generated"><Layers className="w-3.5 h-3.5 opacity-70"/> Flashcards</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 relative z-10">
                    <button
                      onClick={(e) => handleRetry(lecture.id, e)}
                      disabled={retryingIds.has(lecture.id) || (isProcessing && !isFailed)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
                        isFailed 
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground disabled:opacity-50"
                      )}
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", retryingIds.has(lecture.id) && "animate-spin")} />
                      {isFailed ? "Retry Failed AI" : "Regenerate"}
                    </button>
                    {lecture.aiStatus === 'completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open(`/courses/${lecture.courseId}/lectures/${lecture.id}`, '_blank'); }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] border border-primary/20 rounded-md transition-all"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
