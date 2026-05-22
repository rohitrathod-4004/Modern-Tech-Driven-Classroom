import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/apiClient";

interface RagCitation {
  session_id: string;
  lecture_title: string;
  chunk_index: number;
  text: string;
  start_time: number;
  end_time: number;
}

interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
  citations?: RagCitation[];
}

interface ClassroomAssistantProps {
  classroomId: string;
  classroomName: string;
}

export const ClassroomAssistant: React.FC<ClassroomAssistantProps> = ({
  classroomId,
  classroomName,
}) => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setError(null);
    setChatHistory((prev) => [...prev, { sender: "user", text: currentQuestion }]);
    setIsAsking(true);

    try {
      const res = await apiClient.post<{ answer: string; citations: RagCitation[] }>(
        `/api/classrooms/${classroomId}/ask`,
        { question: currentQuestion }
      );

      setChatHistory((prev) => [
        ...prev,
        { sender: "assistant", text: res.answer, citations: res.citations },
      ]);
    } catch (err: any) {
      console.error("[ClassroomAssistant] API error:", err);
      setError(err.message || "Failed to retrieve response from assistant.");
    } finally {
      setIsAsking(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        background: "rgba(30, 41, 59, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#38bdf8" }}>
          💬 Classroom AI Assistant
        </h3>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
          Queries all lectures in {classroomName}
        </span>
      </div>

      {/* Message History Window */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.5)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          padding: "1rem",
          height: "250px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {chatHistory.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#64748b",
              fontSize: "0.85rem",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            Ask anything across all recordings in this classroom. The AI assistant will synthesize answers with cited timestamps.
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                background: msg.sender === "user" ? "#0284c7" : "rgba(30, 41, 59, 0.85)",
                color: "#f8fafc",
                padding: "0.5rem 0.85rem",
                borderRadius: "12px",
                borderTopRightRadius: msg.sender === "user" ? "2px" : "12px",
                borderTopLeftRadius: msg.sender === "user" ? "12px" : "2px",
                maxWidth: "85%",
                fontSize: "0.85rem",
                lineHeight: "1.4",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
              }}
            >
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    paddingTop: "0.4rem",
                    fontSize: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#38bdf8" }}>Sources:</span>
                  {msg.citations.map((cit, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => navigate(`/lecture/${cit.session_id}?t=${cit.start_time}`)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: 0,
                        fontSize: "0.72rem",
                        textDecoration: "underline",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                      title={`Jump to ${cit.lecture_title} at ${formatTime(cit.start_time)}`}
                    >
                      [{cIdx + 1}] {cit.lecture_title} ({formatTime(cit.start_time)})
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {isAsking && (
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              color: "#64748b",
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid #64748b",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>Thinking...</span>
          </div>
        )}

        {error && (
          <div style={{ color: "#ef4444", fontSize: "0.8rem", textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Input controls */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Ask a classroom-wide question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            flex: 1,
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "#f8fafc",
            padding: "0.5rem 0.75rem",
            fontSize: "0.85rem",
            outline: "none",
          }}
          disabled={isAsking}
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          style={{
            background: "#38bdf8",
            color: "#0f172a",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            opacity: isAsking || !question.trim() ? 0.5 : 1,
          }}
        >
          Ask AI
        </button>
      </form>
    </div>
  );
};
