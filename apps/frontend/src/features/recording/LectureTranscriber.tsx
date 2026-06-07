import { useState, useEffect } from "react";
import { Recorder } from "../../components/Recorder";
import { Transcript } from "../../components/Transcript";
import type { TranscriptChunk } from "../../components/Transcript";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../infrastructure/api";
import { ArrowLeft, Mic } from "lucide-react";

export function LectureTranscriber() {
  const navigate = useNavigate();
  const location = useLocation();

  const [lectureId, setLectureId] = useState<string | null>(location.state?.lectureId || null);
  const courseId = location.state?.courseId;

  // Protect against direct navigation without a course
  useEffect(() => {
    if (!courseId) {
      navigate('/dashboard');
    }
  }, [courseId, navigate]);

  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);

  const handleNewChunk = (
    chunk_index: number, 
    text: string, 
    status: "live" | "offline" | "synced"
  ) => {
    setChunks((prev) => {
      const existingIndex = prev.findIndex((c) => c.chunk_index === chunk_index);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { chunk_index, text, status };
        return updated.sort((a, b) => a.chunk_index - b.chunk_index);
      }
      return [...prev, { chunk_index, text, status }].sort((a, b) => a.chunk_index - b.chunk_index);
    });
  };

  const handleEndLecture = async () => {
    if (lectureId) {
      try {
        await api.post(`/api/lectures/${lectureId}/end`);
      } catch (err) {
        console.error('Failed to end lecture', err);
      }
    }
    navigate('/dashboard');
  };

  if (!courseId) return null;

  return (
    <div className="flex h-full flex-col bg-background relative overflow-hidden">
      {/* Cinematic ambient background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 bg-background/60 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleEndLecture}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-500 animate-pulse" />
              Live Transcriber
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Recording will be tied to this course.</p>
          </div>
        </div>
        <div>
          <button 
            onClick={handleEndLecture} 
            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 font-medium text-sm rounded-lg transition-colors"
          >
            End Lecture & Process
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto px-8 py-8 relative z-10 flex flex-col max-w-5xl mx-auto w-full gap-8">
        <Recorder 
          lectureId={lectureId}
          setLectureId={setLectureId}
          courseId={courseId} 
          chunksProcessed={chunks.length}
          onNewChunk={handleNewChunk} 
        />
        
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl shadow-xl flex-1 overflow-hidden p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4 border-b border-border/40 pb-4">Live Transcript stream</h2>
          <Transcript chunks={chunks} />
        </div>
      </div>
    </div>
  );
}
