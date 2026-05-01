import React, { useState, useRef, useEffect } from "react";
import { uploadChunk } from "../services/api";
import { saveChunkOffline, removeChunkOffline } from "../services/indexedDb";

interface RecorderProps {
  sessionId: string;
  chunksProcessed: number;
  onNewChunk: (index: number, text: string, status: "live" | "offline" | "synced") => void;
  onResetSession: () => void;
}

interface QueueItem {
  chunk_index: number;
  blob: Blob;
  status: "pending" | "sending" | "done";
  retryCount: number;
  session_id: string;
}

export const Recorder: React.FC<RecorderProps> = ({
  sessionId,
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
  const activeSessionIdRef = useRef<string>(sessionId);

  useEffect(() => {
    activeSessionIdRef.current = sessionId;
  }, [sessionId]);

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
        if (activeSessionIdRef.current !== sessionId) break;

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
            const runSession = currentItem.session_id;
            console.log(`[Queue] sending chunk ${currentItem.chunk_index}`);
            
            const result = await uploadChunk(
              currentItem.blob,
              runSession,
              currentItem.chunk_index,
              language
            );

            if (result && (result as any).error === "transcription_unavailable") {
              throw new Error("Service down");
            }

            if (result && result.text && runSession === activeSessionIdRef.current) {
              onNewChunk(currentItem.chunk_index, result.text, "synced");
            }

            currentItem.status = "done";
            success = true;

            await removeChunkOffline(`${runSession}-${currentItem.chunk_index}`);
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
              id: `${activeSessionIdRef.current}-${currentChunkIndex}`,
              session_id: activeSessionIdRef.current,
              chunk_index: currentChunkIndex,
              blob: event.data,
              language,
            });

            queueRef.current.push({
              chunk_index: currentChunkIndex,
              blob: event.data,
              status: "pending",
              retryCount: 0,
              session_id: activeSessionIdRef.current,
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
    <div>
      <div className="status-row">
        <div className="status-badge">
          <span className={`status-dot ${isRecording ? "recording" : "stopped"}`} />
          {isRecording ? `Recording (${formatDuration(duration)})` : "Stopped"}
        </div>

        {/* Dynamic network state visuals */}
        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
          {networkState === "online" && <span style={{ color: "#10b981" }}>● Online</span>}
          {networkState === "offline" && <span style={{ color: "#fbbf24" }}>● Offline Mode</span>}
          {networkState === "syncing" && (
            <span style={{ color: "#38bdf8", animation: "pulse 1s infinite" }}>
              🔄 Syncing {pendingCount} chunk(s)...
            </span>
          )}
        </div>

        <div className="session-tag" style={{ display: "flex", gap: "1rem" }}>
          <span>Processed: {chunksProcessed} Chunks</span>
          <span>Session: {sessionId}</span>
        </div>
      </div>

      <div className="controls-panel">
        <div className="language-selector">
          <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Lang:</span>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRecording}
            maxLength={5}
          />
        </div>

        {!isRecording ? (
          <button className="btn btn-start" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button className="btn btn-stop" onClick={stopRecording}>
            Stop Recording
          </button>
        )}

        <button className="btn btn-reset" onClick={handleNewSessionClick}>
          New Session
        </button>
      </div>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
};
