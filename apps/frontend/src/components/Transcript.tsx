import React, { useState, useEffect, useRef } from "react";

export interface TranscriptChunk {
  chunk_index: number;
  text: string;
  status: "live" | "offline" | "synced";
}

interface TranscriptProps {
  chunks: TranscriptChunk[];
}

export const Transcript: React.FC<TranscriptProps> = ({ chunks }) => {
  const [displayedText, setDisplayedText] = useState<string>("");
  const queuedWordsRef = useRef<{ text: string; status: string }[]>([]);
  const processedChunksRef = useRef<Set<number>>(new Set());
  const isTypingRef = useRef<boolean>(false);
  
  const boxRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedText]);

  useEffect(() => {
    if (chunks.length === 0) {
      setDisplayedText("");
      queuedWordsRef.current = [];
      processedChunksRef.current.clear();
      isTypingRef.current = false;
      return;
    }

    // Handle syncing updates: if a chunk was previously offline but is now synced/live
    // we need to update its text in the display.
    // To keep it simple, let's rebuild the displayed text when a chunk upgrades its status
    // or simply append new items sequentially.
    
    const newChunks = chunks.filter((c) => !processedChunksRef.current.has(c.chunk_index));
    
    if (newChunks.length > 0) {
      newChunks.sort((a, b) => a.chunk_index - b.chunk_index);

      const itemsToAppend: { text: string; status: string }[] = [];
      newChunks.forEach((chunk) => {
        processedChunksRef.current.add(chunk.chunk_index);
        const words = chunk.text.split(/\s+/).filter((w) => w.length > 0);
        words.forEach((w) => itemsToAppend.push({ text: w, status: chunk.status }));
      });

      queuedWordsRef.current.push(...itemsToAppend);

      if (!isTypingRef.current) {
        processQueue();
      }
    }
  }, [chunks]);

  const processQueue = () => {
    if (queuedWordsRef.current.length === 0) {
      isTypingRef.current = false;
      return;
    }

    isTypingRef.current = true;
    const nextItem = queuedWordsRef.current.shift();

    if (nextItem) {
      setDisplayedText((prev) => (prev ? `${prev} ${nextItem.text}` : nextItem.text));
    }

    const delay = 50;
    setTimeout(processQueue, delay);
  };

  const handleCopy = () => {
    if (!displayedText) return;
    navigator.clipboard.writeText(displayedText);
    alert("Copied!");
  };

  const handleDownload = () => {
    if (!displayedText) return;
    const blob = new Blob([displayedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case "offline":
        return <span style={{ color: "#fbbf24", fontStyle: "italic", fontSize: "0.75rem" }}>(offline)</span>;
      case "synced":
        return <span style={{ color: "#38bdf8", fontSize: "0.75rem" }}>✓</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <div className="transcript-box" ref={boxRef}>
        {chunks.length > 0 ? (
          <div className="transcript-text">
            {chunks.map((c) => (
              <span 
                key={c.chunk_index} 
                style={{ 
                  opacity: c.status === "offline" ? 0.5 : 1,
                  fontStyle: c.status === "offline" ? "italic" : "normal",
                  marginRight: "6px"
                }}
              >
                {c.text} {renderStatusTag(c.status)}
              </span>
            ))}
          </div>
        ) : (
          <div className="transcript-placeholder">
            Start recording to generate the lecture transcript.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {chunks.length > 0 && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
          <button className="btn btn-reset" onClick={handleCopy}>
            📋 Copy
          </button>
          <button className="btn btn-reset" onClick={handleDownload}>
            💾 Download
          </button>
        </div>
      )}
    </div>
  );
};
