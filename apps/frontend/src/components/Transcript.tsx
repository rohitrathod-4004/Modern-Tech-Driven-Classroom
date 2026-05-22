import React, { useEffect, useRef } from "react";

export interface TranscriptChunk {
  chunk_index: number;
  text: string;
  status: "live" | "offline" | "synced";
}

interface TranscriptProps {
  chunks: TranscriptChunk[];
}

export const Transcript: React.FC<TranscriptProps> = ({ chunks }) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // Auto-scroll logic: only scroll if the user is already near the bottom
  useEffect(() => {
    if (boxRef.current && bottomRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = boxRef.current;
      // Check if user was near the bottom before the new chunk arrived
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      if (isNearBottom || prevScrollHeightRef.current === 0) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
      
      prevScrollHeightRef.current = scrollHeight;
    }
  }, [chunks]);

  const handleCopy = () => {
    if (chunks.length === 0) return;
    const fullText = chunks.map(c => c.text).join(" ");
    navigator.clipboard.writeText(fullText);
    alert("Copied!");
  };

  const handleDownload = () => {
    if (chunks.length === 0) return;
    const fullText = chunks.map(c => c.text).join(" ");
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div style={{ marginTop: "1rem", height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="transcript-box" ref={boxRef}>
        {chunks.length > 0 ? (
          <div className="transcript-text">
            {chunks.map((c) => (
              <span 
                key={c.chunk_index} 
                style={{ opacity: c.status === "offline" ? 0.7 : 1 }}
              >
                {c.text}{" "}
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
