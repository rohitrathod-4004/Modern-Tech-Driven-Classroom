import React, { useState, useRef, useEffect } from "react";
import { uploadChunk } from "../services/api";
import { saveChunkOffline, removeChunkOffline } from "../services/indexedDb";

interface RecorderProps {
  lectureId: string | null;
  setLectureId: (id: string) => void;
  courseId: string;
  chunksProcessed: number;
  onNewChunk: (index: number, text: string, status: "live" | "offline" | "synced") => void;
  onResetSession: () => void;
}

interface QueueItem {
  chunk_index: number;
  blob: Blob;
  status: "pending" | "sending" | "done";
  retryCount: number;
  lectureId: string;
  courseId: string;
}

export const Recorder: React.FC<RecorderProps> = ({
  lectureId,
  setLectureId,
  courseId,
  chunksProcessed,
  onNewChunk,
  onResetSession,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  // UX status flags
  const [networkState, setNetworkState] = useState<"online" | "offline" | "syncing">(
    navigator.onLine ? "online" : "offline"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  
  const chunkIndexRef = useRef<number>(0);
  const queueRef = useRef<QueueItem[]>([]);
  const isWorkerRunningRef = useRef<boolean>(false);
  const activeLectureIdRef = useRef<string | null>(lectureId);

  useEffect(() => {
    activeLectureIdRef.current = lectureId;
  }, [lectureId]);

  useEffect(() => {
    const goOnline = () => {
      setNetworkState("online");
      processQueue();
    };
    const goOffline = () => {
      setNetworkState("offline");
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      durationRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [isRecording]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const processQueue = async () => {
    if (isWorkerRunningRef.current) return;
    isWorkerRunningRef.current = true;

    try {
      while (true) {
        if (!activeLectureIdRef.current) break;

        const pendingItems = queueRef.current
          .filter((item) => item.status !== "done")
          .sort((a, b) => a.chunk_index - b.chunk_index);

        if (pendingItems.length === 0) break;

        const currentItem = pendingItems[0];
        currentItem.status = "sending";

        let success = false;

        while (currentItem.retryCount < 3 && !success) {
          if (!navigator.onLine) {
            currentItem.status = "pending";
            setNetworkState("offline");
            isWorkerRunningRef.current = false;
            return;
          }

          setNetworkState("syncing");

          try {
            const runLecture = currentItem.lectureId;
            const runCourse = currentItem.courseId;
            console.log(`[Queue] sending chunk ${currentItem.chunk_index}`);
            
            const result = await uploadChunk(
              currentItem.blob,
              runLecture,
              runCourse,
              currentItem.chunk_index,
              language
            );

            if (result && (result as any).error === "transcription_unavailable") {
              throw new Error("Service down");
            }

            if (result && result.text && runLecture === activeLectureIdRef.current) {
              onNewChunk(currentItem.chunk_index, result.text, "synced");
            }

            currentItem.status = "done";
            success = true;

            await removeChunkOffline(`${runLecture}-${currentItem.chunk_index}`);
            setError(null);
            setNetworkState("online");
          } catch (err) {
            currentItem.retryCount += 1;
            console.warn(`[Queue] retry chunk ${currentItem.chunk_index}`);

            if (currentItem.retryCount >= 3) {
              await new Promise((r) => setTimeout(r, 5000));
              currentItem.retryCount = 0;
            } else {
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        }
      }
    } finally {
      isWorkerRunningRef.current = false;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;

    try {
      setError(null);

      // Deferred Lecture Creation
      let currentLectureId = lectureId;
      if (!currentLectureId) {
        // Need to import api at the top if not already, or fetch
        // Let's assume we can use fetch or api from infrastructure
        const { api } = await import('../infrastructure/api');
        const { data } = await api.post(`/api/courses/${courseId}/lectures`, {
          title: `Live Lecture - ${new Date().toLocaleDateString()}`
        });
        currentLectureId = data.data._id;
        setLectureId(currentLectureId);
        activeLectureIdRef.current = currentLectureId;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      chunkIndexRef.current = 0;
      queueRef.current = [];
      setIsRecording(true);

      const startChunkCycle = () => {
        const options = { mimeType: "audio/webm" };
        const mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const currentChunkIndex = chunkIndexRef.current;
            chunkIndexRef.current += 1;

            await saveChunkOffline({
              id: `${activeLectureIdRef.current}-${currentChunkIndex}`,
              session_id: activeLectureIdRef.current as string, // Keep legacy field name for IndexedDB schema
              chunk_index: currentChunkIndex,
              blob: event.data,
              language,
            });

            queueRef.current.push({
              chunk_index: currentChunkIndex,
              blob: event.data,
              status: "pending",
              retryCount: 0,
              lectureId: activeLectureIdRef.current as string,
              courseId: courseId
            });

            // Provide immediate offline visibility if network is completely gone
            if (!navigator.onLine) {
              onNewChunk(currentChunkIndex, "[Audio snippet captured offline]", "offline");
            }

            processQueue();
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      };

      startChunkCycle();

      intervalRef.current = window.setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          startChunkCycle();
        }
      }, 3000);

    } catch (err: any) {
      setError(`Microphone error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleNewSessionClick = () => {
    stopRecording();
    chunkIndexRef.current = 0;
    queueRef.current = [];
    setDuration(0);
    setError(null);
    onResetSession();
  };

  const pendingCount = queueRef.current.filter((q) => q.status !== "done").length;

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
      
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" : "bg-muted-foreground"}`} />
          <span className={`text-lg font-semibold tabular-nums ${isRecording ? "text-red-500" : "text-muted-foreground"}`}>
            {isRecording ? `Recording • ${formatDuration(duration)}` : "Not Recording"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/30 border border-border/40">
            {networkState === "online" && <span className="text-emerald-500 font-medium">● Online</span>}
            {networkState === "offline" && <span className="text-amber-500 font-medium">● Offline</span>}
            {networkState === "syncing" && <span className="text-blue-500 font-medium animate-pulse">● Syncing ({pendingCount})</span>}
          </div>
          <div className="px-2.5 py-1 rounded-md bg-secondary/30 border border-border/40">
            Processed: {chunksProcessed}
          </div>
          {lectureId && (
            <div className="px-2.5 py-1 rounded-md bg-secondary/30 border border-border/40 font-mono text-[11px] truncate max-w-[150px]">
              ID: {lectureId}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/20 rounded-xl border border-border/40">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lang</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRecording}
            maxLength={5}
            className="w-12 bg-transparent text-foreground text-sm font-medium focus:outline-none border-b border-dashed border-border/60 focus:border-primary pb-0.5 text-center"
          />
        </div>

        {!isRecording ? (
          <button 
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.6)] hover:-translate-y-0.5" 
            onClick={startRecording}
          >
            Start Recording
          </button>
        ) : (
          <button 
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.5)] hover:-translate-y-0.5" 
            onClick={stopRecording}
          >
            Stop Recording
          </button>
        )}
      </div>

      {error && <div className="absolute -bottom-12 left-0 right-0 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg text-center">{error}</div>}
    </div>
  );
};
