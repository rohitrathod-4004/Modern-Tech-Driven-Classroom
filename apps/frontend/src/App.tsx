import { useState, useRef } from "react";
import { Recorder } from "./components/Recorder";
import { Transcript } from "./components/Transcript";
import { Summary } from "./components/Summary";
import { ArchitectureModal } from "./components/ArchitectureModal";
import type { TranscriptChunk } from "./components/Transcript";
import { DEMO_CHUNKS, DEMO_SUMMARY } from "./data/demoData";

function App() {
  const [sessionId, setSessionId] = useState<string>(`session-${Date.now()}`);
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [showArch, setShowArch] = useState<boolean>(false);
  const processedIndicesRef = useRef<Set<number>>(new Set());

  const handleNewChunk = (
    chunk_index: number, 
    text: string, 
    status: "live" | "offline" | "synced"
  ) => {
    setChunks((prev) => {
      // Check if the chunk already exists
      const existingIndex = prev.findIndex((c) => c.chunk_index === chunk_index);
      
      if (existingIndex !== -1) {
        // Update status/text if moving from offline to synced
        const updated = [...prev];
        updated[existingIndex] = { chunk_index, text, status };
        return updated.sort((a, b) => a.chunk_index - b.chunk_index);
      }

      // Add new
      const updated = [...prev, { chunk_index, text, status }];
      return updated.sort((a, b) => a.chunk_index - b.chunk_index);
    });
  };

  const handleResetSession = () => {
    setSessionId(`session-${Date.now()}`);
    setChunks([]);
    setIsDemo(false);
    processedIndicesRef.current.clear();
  };

  const loadDemoSession = () => {
    setSessionId(`demo-session-${Date.now()}`);
    setChunks(DEMO_CHUNKS);
    setIsDemo(true);
    processedIndicesRef.current.clear();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
          <h1>Lecture Transcriber</h1>
          {isDemo && <span className="demo-badge">Demo Mode Active</span>}
        </div>
        <p>Offline-first, hardware accelerated, resilient microprocessing.</p>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
          {!isDemo && (
            <button className="btn btn-reset" onClick={loadDemoSession}>
              ✨ Load Demo Session
            </button>
          )}
          <button className="btn btn-reset" onClick={() => setShowArch(true)}>
            🏗️ View Architecture
          </button>
        </div>
      </header>
      
      <Recorder 
        sessionId={sessionId} 
        chunksProcessed={chunks.length}
        onNewChunk={handleNewChunk} 
        onResetSession={handleResetSession} 
      />
      
      <Transcript chunks={chunks} />
      
      <Summary sessionId={sessionId} demoData={isDemo ? DEMO_SUMMARY : null} />

      {showArch && <ArchitectureModal onClose={() => setShowArch(false)} />}
    </div>
  );
}

export default App;
