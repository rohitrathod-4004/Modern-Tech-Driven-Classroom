import { useState, useRef } from "react";
import { Recorder } from "./components/Recorder";
import { Transcript } from "./components/Transcript";
import type { TranscriptChunk } from "./components/Transcript";

function App() {
  const [sessionId, setSessionId] = useState<string>(`session-${Date.now()}`);
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
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
    processedIndicesRef.current.clear();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Lecture Transcriber</h1>
        <p>Offline-first, hardware accelerated, resilient microprocessing.</p>
      </header>
      
      <Recorder 
        sessionId={sessionId} 
        chunksProcessed={chunks.length}
        onNewChunk={handleNewChunk} 
        onResetSession={handleResetSession} 
      />
      
      <Transcript chunks={chunks} />
    </div>
  );
}

export default App;
