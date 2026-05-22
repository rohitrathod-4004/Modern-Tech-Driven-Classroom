import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLectureDetail } from "../hooks/useLectureDetail";
import { useBookmarks } from "../hooks/useBookmarks";
import { Summary } from "../components/Summary";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";

export const LectureDetail: React.FC = () => {
  const { session_id } = useParams<{ session_id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tParam = searchParams.get("t");
  const { detail, loading, error, fetchDetail } = useLectureDetail();
  const { bookmarks, fetchBookmarks, addBookmark, deleteBookmark } = useBookmarks();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const totalDuration = useMemo(() => {
    if (!detail || !detail.transcript || detail.transcript.length === 0) return 0;
    const last = detail.transcript[detail.transcript.length - 1];
    return last.end_time || (last.start_time || 0) + 5;
  }, [detail]);

  const togglePlay = () => {
    if (detail?.lecture?.audio_url) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  interface RagCitation {
    session_id: string;
    lecture_title: string;
    chunk_index: number;
    text: string;
    start_time: number;
    end_time: number;
  }

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "assistant"; text: string; citations?: RagCitation[] }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setAskError(null);
    setChatHistory((prev) => [...prev, { sender: "user", text: currentQuestion }]);
    setIsAsking(true);

    try {
      const res = await apiClient.post<{ answer: string; citations: RagCitation[] }>(
        `/api/lectures/${session_id}/ask`,
        { question: currentQuestion }
      );

      setChatHistory((prev) => [
        ...prev,
        { sender: "assistant", text: res.answer, citations: res.citations },
      ]);
    } catch (err: any) {
      setAskError(err.message || "Failed to get answer");
    } finally {
      setIsAsking(false);
    }
  };

  // Sync playback speed with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleLoadedMetadata = () => {
    if (tParam && audioRef.current) {
      const seconds = parseFloat(tParam);
      if (!isNaN(seconds)) {
        audioRef.current.currentTime = seconds;
        setCurrentTime(seconds);
      }
    }
  };

  // Fallback simulator if session has no audio
  useEffect(() => {
    if (detail?.lecture?.audio_url) return;
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, playbackSpeed, detail?.lecture?.audio_url]);

  useEffect(() => {
    if (session_id) {
      fetchDetail(session_id);
      fetchBookmarks();
    }
  }, [session_id, fetchDetail, fetchBookmarks]);

  // Handle deep-link seeking on initial detail load
  useEffect(() => {
    if (tParam && !loading && detail) {
      const seconds = parseFloat(tParam);
      if (!isNaN(seconds)) {
        setCurrentTime(seconds);
        if (audioRef.current) {
          audioRef.current.currentTime = seconds;
        }
      }
    }
  }, [tParam, loading, detail]);

  const bookmarkedMap = useMemo(() => {
    const map: Record<number, string> = {};
    bookmarks.filter(b => b.session_id === session_id).forEach(b => {
      map[b.chunk_index] = b._id;
    });
    return map;
  }, [bookmarks, session_id]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const checkChunkMatchesTopic = (chunkText: string, topic: string | null): boolean => {
    if (!topic) return true;
    const lowerText = chunkText.toLowerCase();
    const lowerTopic = topic.toLowerCase();
    
    if (lowerText.includes(lowerTopic)) return true;

    const keywords = lowerTopic.split(/\s+/).filter(word => word.length > 3);
    if (keywords.length > 0 && keywords.every(kw => lowerText.includes(kw))) {
      return true;
    }
    return false;
  };

  const handleToggleBookmark = async (chunk: any) => {
    const bookmarkId = bookmarkedMap[chunk.chunk_index];
    if (bookmarkId) {
      try {
        await deleteBookmark(bookmarkId);
      } catch (err) {
        console.error("Failed to delete bookmark:", err);
      }
    } else {
      try {
        await addBookmark(
          session_id!,
          chunk.chunk_index,
          chunk.text || "[Silent segment]",
          chunk.start_time || 0
        );
      } catch (err) {
        console.error("Failed to create bookmark:", err);
      }
    }
  };

  const lecture = detail?.lecture;
  const transcript = detail?.transcript || [];
  const summary = detail?.summary;

  const activeChunkIndex = useMemo(() => {
    if (!transcript) return -1;
    return transcript.findIndex(
      (chunk) => currentTime >= (chunk.start_time || 0) && currentTime <= (chunk.end_time || 0)
    );
  }, [transcript, currentTime]);

  useEffect(() => {
    if (activeChunkIndex !== -1) {
      const el = document.getElementById(`chunk-${activeChunkIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeChunkIndex]);

  const topicTimeline = useMemo(() => {
    if (!summary || !summary.topics || !transcript) return [];

    return summary.topics.map((topic: string) => {
      const matchingChunks = transcript.filter((chunk) =>
        checkChunkMatchesTopic(chunk.text || "", topic)
      );

      if (matchingChunks.length === 0) return null;

      const startTime = Math.min(...matchingChunks.map((c) => c.start_time || 0));
      const endTime = Math.max(...matchingChunks.map((c) => c.end_time || 0));

      return {
        title: topic,
        startTime,
        endTime,
      };
    }).filter(Boolean) as Array<{ title: string; startTime: number; endTime: number }>;
  }, [summary, transcript]);

  if (loading) {
    return (
      <div className="lecture-detail-loading">
        <div className="spinner"></div>
        <p>Loading lecture...</p>
      </div>
    );
  }

  if (error || !detail || !lecture) {
    return (
      <div className="lecture-detail-error">
        <p>⚠️ {error || "Lecture not found."}</p>
        <button className="btn btn-reset" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  return (
    <div className="lecture-detail-page">
      {/* Header */}
      <div className="lecture-detail-header">
        <button className="lecture-detail-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="lecture-detail-title-row">
          <h2>{lecture.title}</h2>
          <span className={`lecture-status ${lecture.status}`}>{lecture.status}</span>
          {lecture.processing_state.summary === "completed" && (
            <span className="processing-badge summary-done">✓ Summary Saved</span>
          )}
        </div>
        <p className="lecture-detail-meta">
          Started: {new Date(lecture.startedAt).toLocaleString()}
          {lecture.endedAt && ` · Ended: ${new Date(lecture.endedAt).toLocaleString()}`}
        </p>
      </div>

      <div className="lecture-grid">
        <div className="lecture-main">
          {/* Audio Seeker Timeline */}
          {transcript.length > 0 && (
            <div style={{
              background: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)"
            }}>
              {lecture.audio_url && (
                <audio
                  ref={audioRef}
                  src={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${lecture.audio_url}?token=${authService.getToken()}`}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setCurrentTime(audioRef.current.currentTime);
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={handleLoadedMetadata}
                />
              )}
              <button
                onClick={togglePlay}
                style={{
                  background: "#38bdf8",
                  border: "none",
                  color: "#0f172a",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1.2rem"
                }}
                title={isPlaying ? "Pause Playback" : "Play Recording"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "0.8rem", fontFamily: "monospace" }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalDuration)}</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={totalDuration}
                  value={currentTime}
                  onChange={(e) => {
                    const seekVal = Number(e.target.value);
                    setCurrentTime(seekVal);
                    if (audioRef.current) {
                      audioRef.current.currentTime = seekVal;
                    }
                  }}
                  style={{
                    width: "100%",
                    accentColor: "#38bdf8",
                    cursor: "pointer",
                    height: "6px",
                    borderRadius: "3px",
                    background: "#1e293b",
                    border: "none"
                  }}
                />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Speed:</span>
                <select 
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  style={{
                    background: "rgba(15,23,42,0.5)",
                    color: "#cbd5e1",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  <option value={1}>1.0x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2.0x</option>
                </select>
              </div>
            </div>
          )}

          <div className="lecture-detail-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Full Transcript</h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>💡 Click any row to seek media playback</span>
            </div>
            {selectedTopic && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                marginBottom: "1rem"
              }}>
                <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                  Filtering by topic: <strong style={{ color: "#38bdf8" }}>{selectedTopic}</strong>
                </span>
                <button 
                  onClick={() => setSelectedTopic(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f43f5e",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8rem"
                  }}
                >
                  Clear Filter ✕
                </button>
              </div>
            )}
            {transcript.length === 0 ? (
              <div className="detail-empty-state">
                <span>📝</span>
                <p>No transcript was recorded for this session.</p>
              </div>
            ) : (
              <div className="lecture-detail-transcript" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {transcript.map((chunk, i) => {
                  const isBookmarked = !!bookmarkedMap[chunk.chunk_index];
                  const matchesTopic = checkChunkMatchesTopic(chunk.text || "", selectedTopic);
                  const isHighlighted = currentTime >= (chunk.start_time || 0) && currentTime <= (chunk.end_time || (chunk.start_time || 0) + 10);
                  
                  return (
                    <div 
                      key={i} 
                      id={`chunk-${i}`}
                      onClick={() => {
                        const seekVal = chunk.start_time || 0;
                        setCurrentTime(seekVal);
                        if (audioRef.current) {
                          audioRef.current.currentTime = seekVal;
                        }
                      }}
                      style={{ 
                        display: "flex", 
                        alignItems: "start", 
                        gap: "1rem", 
                        padding: "0.5rem 1rem", 
                        borderRadius: "8px", 
                        background: isHighlighted 
                          ? "rgba(56, 189, 248, 0.12)" 
                          : (isBookmarked ? "rgba(250, 204, 21, 0.08)" : "rgba(30, 41, 59, 0.4)"),
                        border: isHighlighted
                          ? "1px solid rgba(56, 189, 248, 0.4)"
                          : (isBookmarked ? "1px solid rgba(250, 204, 21, 0.3)" : "1px solid rgba(255,255,255,0.03)"),
                        transition: "all 0.2s",
                        opacity: matchesTopic ? 1 : 0.25,
                        cursor: "pointer",
                        boxShadow: isHighlighted ? "0 0 12px rgba(56, 189, 248, 0.15)" : "none"
                      }}
                    >
                      <span style={{ color: isHighlighted ? "#38bdf8" : "#94a3b8", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "2px", minWidth: "40px" }}>
                        {formatTime(chunk.start_time || 0)}
                      </span>
                      <p style={{ flex: 1, margin: 0, color: isHighlighted ? "#f8fafc" : "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.5" }}>
                        {chunk.text || <em style={{ color: "#475569" }}>[Silent segment]</em>}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(chunk);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                          color: isBookmarked ? "#facc15" : "#475569",
                          transition: "all 0.2s",
                          padding: "2px 6px"
                        }}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark Moment"}
                        onMouseOver={(e) => { if (!isBookmarked) e.currentTarget.style.color = "#f59e0b"; }}
                        onMouseOut={(e) => { if (!isBookmarked) e.currentTarget.style.color = "#475569"; }}
                      >
                        ★
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lecture-sidebar">
          <div className="lecture-detail-section">
            <h3>AI Summary</h3>
            {summary ? (
              session_id && (
                <Summary
                  sessionId={session_id}
                  demoData={summary}
                  readOnly={true}
                  onTopicClick={setSelectedTopic}
                />
              )
            ) : (
              <div className="detail-empty-state">
                <span>🤖</span>
                <p>No summary has been generated for this lecture yet.</p>
                {lecture.status === "active" && (
                  <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    The lecture is still active. Summary can be generated from the live viewer.
                  </p>
                )}
              </div>
            )}
          </div>

          {topicTimeline.length > 0 && (
            <div className="lecture-detail-section" style={{ marginTop: "1.5rem" }}>
              <h3>Topic Timeline</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {topicTimeline.map((topic, idx) => {
                  const isCurrent = currentTime >= topic.startTime && currentTime <= topic.endTime;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedTopic(topic.title);
                        if (audioRef.current) {
                          audioRef.current.currentTime = topic.startTime;
                          audioRef.current.play().catch(() => {});
                        }
                      }}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        background: isCurrent ? "rgba(56, 189, 248, 0.12)" : "rgba(30, 41, 59, 0.4)",
                        border: isCurrent ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: isCurrent ? "#38bdf8" : "#f8fafc", fontSize: "0.9rem" }}>
                          {topic.title}
                        </span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>
                          {formatTime(topic.startTime)} - {formatTime(topic.endTime)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ask Lecture Assistant */}
          <div className="lecture-detail-section" style={{ marginTop: "1.5rem" }}>
            <h3>Ask Lecture Assistant</h3>
            <div style={{
              display: "flex",
              flexDirection: "column",
              height: "350px",
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "0.75rem",
              marginTop: "0.75rem"
            }}>
              {/* Message Log */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                paddingRight: "4px",
                marginBottom: "0.75rem"
              }}>
                {chatHistory.length === 0 ? (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#64748b",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    padding: "1rem"
                  }}>
                    <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💬</span>
                    Ask a question about the lecture topics, formulas, or discussions.
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                        background: msg.sender === "user" ? "#38bdf8" : "rgba(30, 41, 59, 0.8)",
                        color: msg.sender === "user" ? "#0f172a" : "#f8fafc",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "12px",
                        borderTopRightRadius: msg.sender === "user" ? "2px" : "12px",
                        borderTopLeftRadius: msg.sender === "user" ? "12px" : "2px",
                        maxWidth: "85%",
                        fontSize: "0.85rem",
                        lineHeight: "1.4",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                      
                      {msg.citations && msg.citations.length > 0 && (
                        <div style={{
                          marginTop: "0.5rem",
                          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                          paddingTop: "0.4rem",
                          fontSize: "0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem"
                        }}>
                          <span style={{ fontWeight: 600, color: "#38bdf8" }}>Sources:</span>
                          {msg.citations.map((cit, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => {
                                if (audioRef.current) {
                                  audioRef.current.currentTime = cit.start_time;
                                  audioRef.current.play().catch(() => {});
                                }
                              }}
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
                                display: "block"
                              }}
                              title="Click to jump to this moment"
                            >
                              [{cIdx + 1}] {formatTime(cit.start_time)} - {cit.text.substring(0, 40)}...
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isAsking && (
                  <div style={{ alignSelf: "flex-start", display: "flex", gap: "0.5rem", alignItems: "center", color: "#64748b", fontSize: "0.85rem" }}>
                    <div className="spinner" style={{ width: "14px", height: "14px", border: "2px solid #64748b", borderTopColor: "transparent" }}></div>
                    <span>Assistant is thinking...</span>
                  </div>
                )}
                {askError && (
                  <div style={{ color: "#f43f5e", fontSize: "0.8rem", textAlign: "center", padding: "0.25rem" }}>
                    ⚠️ {askError}
                  </div>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleAskQuestion} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none"
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
                    borderRadius: "6px",
                    padding: "0.4rem 0.75rem",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    opacity: isAsking || !question.trim() ? 0.5 : 1
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

