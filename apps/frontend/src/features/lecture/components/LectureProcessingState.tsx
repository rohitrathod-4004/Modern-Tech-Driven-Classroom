import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../../infrastructure/api';

interface LectureProcessingStateProps {
  lecture: any;
  onRefresh: () => void;
}

const STAGES = [
  { id: 'recording', label: 'Recording / Uploading' },
  { id: 'transcribing', label: 'Audio Transcribing' },
  { id: 'summarizing', label: 'Summarizing Content' },
  { id: 'embedding', label: 'Generating Embeddings' },
  { id: 'indexing', label: 'Building Search Index' },
  { id: 'generating_study_materials', label: 'Generating Study Materials' },
  { id: 'completed', label: 'Ready' }
];

export const LectureProcessingState: React.FC<LectureProcessingStateProps> = ({ lecture, onRefresh }) => {
  const isFailed = lecture.aiStatus === 'failed';
  
  // Determine current stage index based on lecture status and aiStatus
  const getCurrentStageIndex = () => {
    if (isFailed) {
      // Find the stage before 'completed' or just assume it failed during AI processing
      return STAGES.findIndex(s => s.id === 'generating_study_materials'); 
    }
    
    if (lecture.status === 'recording') return 0;
    if (lecture.status === 'transcribing') return 1;
    
    if (lecture.status === 'ai_processing') {
      const idx = STAGES.findIndex(s => s.id === lecture.aiStatus);
      return idx > -1 ? idx : 2; // Default to summarizing if unknown
    }
    
    if (lecture.status === 'ready') return STAGES.length - 1;
    
    return 0;
  };

  const currentStageIndex = getCurrentStageIndex();

  const handleRetry = async () => {
    try {
      await api.post(`/api/admin/lectures/${lecture._id}/reprocess-ai`);
      onRefresh(); // Trigger a fast poll
    } catch (err) {
      console.error('Failed to trigger retry', err);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 max-w-2xl mx-auto shadow-sm my-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          {isFailed ? (
            <><AlertTriangle className="w-6 h-6 text-destructive" /> Processing Failed</>
          ) : (
            <><Loader2 className="w-6 h-6 text-primary animate-spin" /> Lecture Processing</>
          )}
        </h2>
        <p className="text-muted-foreground mt-2">
          {isFailed 
            ? "The AI processing pipeline encountered an error. You can retry the process."
            : "Your lecture is currently being processed by our AI pipeline. This page will automatically update when ready."}
        </p>
      </div>

      <div className="space-y-6 relative">
        {/* Progress Bar Background */}
        <div className="absolute left-[1.3rem] top-2 bottom-6 w-0.5 bg-border -z-10"></div>
        
        {/* Progress Bar Active */}
        <div 
          className="absolute left-[1.3rem] top-2 w-0.5 bg-primary -z-10 transition-all duration-500 ease-in-out"
          style={{ height: `${Math.min(100, Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 100))}%` }}
        ></div>

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex || lecture.status === 'ready';
          const isCurrent = index === currentStageIndex && !isFailed && lecture.status !== 'ready';
          const isError = index === currentStageIndex && isFailed;

          return (
            <div key={stage.id} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors
                ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                  isError ? 'bg-destructive border-destructive text-destructive-foreground' :
                  isCurrent ? 'bg-background border-primary text-primary' : 
                  'bg-background border-border text-muted-foreground'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : 
                 isError ? <AlertTriangle className="w-5 h-5" /> :
                 isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 <Clock className="w-5 h-5 opacity-50" />}
              </div>
              <div>
                <h4 className={`font-medium ${isCurrent ? 'text-foreground' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stage.label}
                </h4>
                {isCurrent && <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Processing...</p>}
                {isError && <p className="text-xs text-destructive mt-0.5">Failed at this stage</p>}
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-2.5 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry AI Processing
          </button>
        </div>
      )}
    </div>
  );
};
