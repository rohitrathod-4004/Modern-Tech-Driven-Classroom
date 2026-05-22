import React, { useState, useEffect } from "react";
import { useClassrooms } from "../hooks/useClassrooms";
import { useLectures } from "../hooks/useLectures";
import { useRevision } from "../hooks/useRevision";
import { useBookmarks } from "../hooks/useBookmarks";
import { InteractiveQuiz } from "../components/InteractiveQuiz";
import { FlashcardDeck } from "../components/FlashcardDeck";

export const RevisionHub: React.FC = () => {
  const { classrooms, loading: classroomsLoading } = useClassrooms();
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  
  const { lectures, loading: lecturesLoading, fetchLectures } = useLectures(selectedClassroomId);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeLectureTitle, setActiveLectureTitle] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"quiz" | "flashcards" | "bookmarks">("quiz");

  const { quiz, flashcards, loading: revisionLoading, fetchRevisionData } = useRevision();
  const { bookmarks, loading: bookmarksLoading, fetchBookmarks, deleteBookmark } = useBookmarks();

  useEffect(() => {
    if (selectedClassroomId) {
      fetchLectures();
    }
  }, [selectedClassroomId, fetchLectures]);

  useEffect(() => {
    if (activeSessionId) {
      fetchRevisionData(activeSessionId);
      fetchBookmarks();
    }
  }, [activeSessionId, fetchRevisionData, fetchBookmarks]);

  const activeBookmarks = bookmarks.filter((b) => b.session_id === activeSessionId);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If a lecture is active, show the study workspace
  if (activeSessionId) {
    return (
      <div className="dashboard-page fade-in">
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button 
            className="btn btn-reset" 
            onClick={() => {
              setActiveSessionId(null);
              setActiveTab("quiz");
            }}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            ← Back to Lectures
          </button>
          <div>
            <h2 className="dashboard-title" style={{ fontSize: "1.5rem", margin: 0 }}>{activeLectureTitle}</h2>
            <p className="dashboard-subtitle" style={{ margin: 0 }}>Revision & Practice Workspace</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          borderBottom: "1px solid rgba(255,255,255,0.05)", 
          marginBottom: "2rem",
          paddingBottom: "0.5rem" 
        }}>
          <button
            onClick={() => setActiveTab("quiz")}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === "quiz" ? "#38bdf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              borderBottom: activeTab === "quiz" ? "2px solid #38bdf8" : "none",
              transition: "all 0.2s"
            }}
          >
            📝 Interactive Quiz
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === "flashcards" ? "#38bdf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              borderBottom: activeTab === "flashcards" ? "2px solid #38bdf8" : "none",
              transition: "all 0.2s"
            }}
          >
            🎴 Flashcards
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === "bookmarks" ? "#38bdf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              borderBottom: activeTab === "bookmarks" ? "2px solid #38bdf8" : "none",
              transition: "all 0.2s"
            }}
          >
            ★ Bookmarked Moments ({activeBookmarks.length})
          </button>
        </div>

        {/* Loading / Error States */}
        {revisionLoading ? (
          <div className="summary-loading">
            <div className="spinner"></div>
            <p>Loading revision materials...</p>
          </div>
        ) : (
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {activeTab === "quiz" && (
              quiz ? (
                <InteractiveQuiz 
                  questions={quiz.questions} 
                  quizId={quiz._id}
                  sessionId={activeSessionId}
                />
              ) : (
                <div className="detail-empty-state" style={{ background: "rgba(30,41,59,0.3)", borderRadius: "16px", padding: "2rem" }}>
                  <span>🤖</span>
                  <h4>Quiz Not Ready</h4>
                  <p style={{ color: "#64748b" }}>
                    The AI is still processing the study material or summary has not been saved for this lecture yet.
                  </p>
                </div>
              )
            )}

            {activeTab === "flashcards" && (
              flashcards ? (
                <FlashcardDeck 
                  cards={flashcards.cards} 
                  sessionId={activeSessionId}
                />
              ) : (
                <div className="detail-empty-state" style={{ background: "rgba(30,41,59,0.3)", borderRadius: "16px", padding: "2rem" }}>
                  <span>🤖</span>
                  <h4>Flashcards Not Ready</h4>
                  <p style={{ color: "#64748b" }}>
                    The AI is still compiling concepts or summary has not been saved for this lecture yet.
                  </p>
                </div>
              )
            )}

            {activeTab === "bookmarks" && (
              <div>
                {bookmarksLoading ? (
                  <p style={{ color: "#94a3b8" }}>Loading bookmarks...</p>
                ) : activeBookmarks.length === 0 ? (
                  <div className="detail-empty-state" style={{ background: "rgba(30,41,59,0.3)", borderRadius: "16px", padding: "2rem" }}>
                    <span>★</span>
                    <h4>No Bookmarks Saved</h4>
                    <p style={{ color: "#64748b" }}>
                      You haven't bookmarked any moments from this lecture yet. Open the transcript detail and click the star icon to save key moments.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {activeBookmarks.map((bookmark) => (
                      <div 
                        key={bookmark._id}
                        style={{
                          background: "rgba(30, 41, 59, 0.4)",
                          border: "1px solid rgba(255,255,255,0.03)",
                          borderRadius: "12px",
                          padding: "1rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          gap: "1rem"
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{ color: "#facc15", fontSize: "0.95rem" }}>★</span>
                            <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "0.85rem" }}>
                              Timestamp {formatTime(bookmark.start_time || 0)}
                            </span>
                          </div>
                          <p style={{ color: "#e2e8f0", fontSize: "0.95rem", margin: "0 0 0.5rem 0", lineHeight: "1.4" }}>
                            "{bookmark.text}"
                          </p>
                        </div>
                        <button
                          onClick={() => deleteBookmark(bookmark._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            padding: "0.25rem"
                          }}
                          title="Remove bookmark"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Dashboard Overview: Select Classroom and view completed lectures
  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-topbar">
        <div>
          <h2 className="dashboard-title">Revision Hub</h2>
          <p className="dashboard-subtitle">Select a lecture to practice quizzes, study flashcards, and review your notes.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column - Classroom Selector */}
        <div className="dashboard-col">
          <div className="dashboard-section-header">
            <h3>Select Classroom</h3>
          </div>

          {classroomsLoading ? (
            <p className="dashboard-empty">Loading classrooms...</p>
          ) : classrooms.length === 0 ? (
            <p className="dashboard-empty">You are not enrolled in any classrooms.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {classrooms.map((c) => {
                const isSelected = selectedClassroomId === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSelectedClassroomId(c._id);
                      setActiveSessionId(null);
                    }}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "12px",
                      background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(30, 41, 59, 0.4)",
                      border: isSelected ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <h4 style={{ margin: 0, color: isSelected ? "#38bdf8" : "#f8fafc" }}>{c.name}</h4>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                      Code: {c.code}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Lectures List */}
        <div className="dashboard-col">
          {selectedClassroomId ? (
            <>
              <div className="dashboard-section-header">
                <h3>Lectures Available</h3>
              </div>

              {lecturesLoading ? (
                <p className="dashboard-empty">Loading lectures...</p>
              ) : lectures.filter(l => l.status === "completed").length === 0 ? (
                <p className="dashboard-empty">No completed lectures found for this classroom.</p>
              ) : (
                <div className="lecture-list">
                  {lectures
                    .filter((lec) => lec.status === "completed")
                    .map((lec) => (
                      <div
                        key={lec._id}
                        className="lecture-item"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1rem",
                          background: "rgba(30, 41, 59, 0.4)",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.03)",
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          setActiveSessionId(lec.session_id);
                          setActiveLectureTitle(lec.title);
                        }}
                      >
                        <div>
                          <div className="lecture-item-title" style={{ fontWeight: 600, color: "#f8fafc" }}>
                            {lec.title}
                          </div>
                          <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                            {new Date(lec.startedAt).toLocaleDateString()} at {new Date(lec.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <button className="btn btn-primary btn-sm">
                          📝 Study
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : (
            <div className="dashboard-placeholder">
              <p>👈 Select a classroom to view revision materials</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
