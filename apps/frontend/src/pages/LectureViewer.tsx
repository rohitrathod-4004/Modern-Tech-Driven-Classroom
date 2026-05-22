import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Recorder } from "../components/Recorder";
import { Transcript } from "../components/Transcript";
import { Summary } from "../components/Summary";
import { ArchitectureModal } from "../components/ArchitectureModal";
import type { TranscriptChunk } from "../components/Transcript";
import { DEMO_CHUNKS, DEMO_SUMMARY } from "../data/demoData";
import { apiClient } from "../services/apiClient";
import { useLectureDetail } from "../hooks/useLectureDetail";

export const LectureViewer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use session_id from URL if present; otherwise generate a fallback (non-persisted session)
  const urlSessionId = searchParams.get("session_id");
  const [sessionId] = useState<string>(
    urlSessionId ?? `session-${Date.now()}`
  );

  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [showArch, setShowArch] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const processedIndicesRef = useRef<Set<number>>(new Set());

  const isLinkedSession = !!urlSessionId;
  const { detail, fetchDetail } = useLectureDetail();

  useEffect(() => {
    if (isLinkedSession && urlSessionId) {
      fetchDetail(urlSessionId);
    }
  }, [isLinkedSession, urlSessionId, fetchDetail]);

  useEffect(() => {
    if (detail && detail.transcript) {
      setChunks(detail.transcript as TranscriptChunk[]);
    }
  }, [detail]);

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
      const updated = [...prev, { chunk_index, text, status }];
      return updated.sort((a, b) => a.chunk_index - b.chunk_index);
    });
  };

  const handleRecordingStop = async () => {
    setIsRecording(false);

    // If this session is linked to a LectureSession record, mark it complete
    if (isLinkedSession) {
      try {
        await apiClient.patch(`/api/lectures/${sessionId}/complete`, {});
        console.log("[LectureViewer] Session marked as completed:", sessionId);
      } catch (err) {
        console.warn("[LectureViewer] Could not mark session as completed:", err);
      }
    }
  };

  const handleResetSession = () => {
    // Reset only resets local UI state — session ID from URL stays stable
    setChunks([]);
    setIsDemo(false);
    processedIndicesRef.current.clear();
  };

  const loadDemoSession = () => {
    setChunks(DEMO_CHUNKS);
    setIsDemo(true);
    processedIndicesRef.current.clear();
  };

  const handleSaveDemoSession = async () => {
    if (!isLinkedSession) {
      alert("Demo session is not linked to any classroom. Start a lecture from the classroom dashboard to save.");
      return;
    }

    try {
      await apiClient.post(`/api/lectures/${sessionId}/demo-setup`, {
        chunks: DEMO_CHUNKS,
        summaryData: DEMO_SUMMARY,
      });

      alert("Demo session saved successfully! Quizzes and flashcards are being generated in the background.");
      navigate("/");
    } catch (err: any) {
      console.error("[LectureViewer] Failed to save demo session:", err);
      alert(`Failed to save demo session: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h1>Lecture Transcriber</h1>
          {isDemo && <span className="demo-badge">Demo Mode Active</span>}
          {isLinkedSession && (
            <span className="session-id-badge" title={`Session: ${sessionId}`}>
              🔗 Session Linked
            </span>
          )}
        </div>
        <p>Offline-first, hardware accelerated, resilient microprocessing.</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {!isDemo && (
            <button className="btn btn-reset" onClick={loadDemoSession}>
              ✨ Load Demo Session
            </button>
          )}
          <button className="btn btn-reset" onClick={() => setShowArch(true)}>
            🏗️ View Architecture
          </button>
          <button className="btn btn-reset" onClick={() => {
            if (isRecording) {
              if (!window.confirm("You are currently recording. Are you sure you want to exit? The lecture will be completed.")) return;
              handleRecordingStop();
            }
            navigate(-1);
          }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="lecture-grid" style={{ marginTop: "2rem" }}>
        <div className="lecture-main">
          <Recorder
            sessionId={sessionId}
            chunksProcessed={chunks.length}
            onNewChunk={handleNewChunk}
            onResetSession={handleResetSession}
            onRecordingStop={handleRecordingStop}
            onRecordingStateChange={setIsRecording}
            isDemo={isDemo}
            onSaveDemo={handleSaveDemoSession}
          />
          <Transcript chunks={chunks} />
        </div>

        <div className="lecture-sidebar">
          <Summary
            sessionId={sessionId}
            demoData={isDemo ? DEMO_SUMMARY : null}
            onSummaryGenerated={isLinkedSession ? async (data) => {
              try {
                await apiClient.post(`/api/lectures/${sessionId}/summary`, { summaryData: data });
              } catch (err) {
                console.warn("[LectureViewer] Could not persist summary:", err);
              }
            } : undefined}
          />
        </div>
      </div>

      {showArch && <ArchitectureModal onClose={() => setShowArch(false)} />}
    </div>
  );
};
