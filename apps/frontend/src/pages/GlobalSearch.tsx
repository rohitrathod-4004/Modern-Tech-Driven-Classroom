import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const { results, loading, error, search } = useSearch();
  const [activeTab, setActiveTab] = useState<"all" | "lectures" | "summaries" | "transcripts">("all");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  // Debounced search response
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        search(query);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, search]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const highlightMatch = (text: string, searchStr: string) => {
    if (!searchStr.trim()) return text;
    const regex = new RegExp(`(${searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} style={{ background: "#38bdf8", color: "#0f172a", borderRadius: "2px", padding: "0 2px" }}>{part}</mark> : part
    );
  };

  const hasResults = results.lectures.length > 0 || results.summaries.length > 0 || results.transcripts.length > 0;

  return (
    <div style={{ padding: "2rem", color: "#f8fafc", minHeight: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header section with glassmorphism */}
      <div style={{
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
      }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#38bdf8", textShadow: "0 0 10px rgba(56, 189, 248, 0.2)" }}>
          Global Lecture Search
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          Find concepts across all classrooms, summaries, transcripts, and lecture notes.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Search concepts, topics, or transcription keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                background: "#0f172a",
                border: "1px solid #475569",
                color: "#f8fafc",
                fontSize: "1rem",
                outline: "none",
                transition: "all 0.3s ease",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#38bdf8"}
              onBlur={(e) => e.target.style.borderColor = "#475569"}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: "1.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "1.1rem"
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            style={{
              padding: "0 2rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
              border: "none",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(56, 189, 248, 0.4)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs Menu */}
      {hasResults && (
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #334155", paddingBottom: "0.5rem" }}>
          {(["all", "lectures", "summaries", "transcripts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "transparent",
                border: "none",
                color: activeTab === tab ? "#38bdf8" : "#94a3b8",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                fontWeight: 600,
                borderBottom: activeTab === tab ? "2px solid #38bdf8" : "none",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem", color: "#38bdf8" }}>
          <div className="animate-spin" style={{ fontSize: "1.5rem" }}>Searching database...</div>
        </div>
      )}

      {/* Results view */}
      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Lectures match */}
          {(activeTab === "all" || activeTab === "lectures") && results.lectures.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "#c084fc", marginBottom: "1rem" }}>Matching Lectures ({results.lectures.length})</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {results.lectures.map((lec) => (
                  <div key={lec.session_id} style={{
                    background: "#1e293b",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    border: "1px solid #334155",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "between",
                    height: "150px"
                  }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", background: "rgba(192, 132, 252, 0.1)", color: "#c084fc", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                        {lec.classroom_name}
                      </span>
                      <h3 style={{ margin: "0.5rem 0", fontSize: "1.1rem", color: "#f8fafc" }}>
                        {highlightMatch(lec.title, query)}
                      </h3>
                      <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>
                        Recorded on: {new Date(lec.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/lecture/${lec.session_id}`}
                      style={{
                        marginTop: "auto",
                        color: "#38bdf8",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        alignSelf: "start"
                      }}
                    >
                      Open Lecture →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summaries match */}
          {(activeTab === "all" || activeTab === "summaries") && results.summaries.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "#38bdf8", marginBottom: "1rem" }}>Matching Summaries & Notes ({results.summaries.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {results.summaries.map((sum) => (
                  <div key={sum.session_id} style={{
                    background: "#1e293b",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    border: "1px solid #334155",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px", marginRight: "0.5rem" }}>
                          {sum.classroom_name}
                        </span>
                        <h3 style={{ display: "inline-block", margin: 0, fontSize: "1.1rem", color: "#f8fafc" }}>
                          {sum.lecture_title}
                        </h3>
                      </div>
                      <Link to={`/lecture/${sum.session_id}`} style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
                        View Full Summary
                      </Link>
                    </div>
                    
                    <p style={{ color: "#cbd5e1", fontSize: "0.9rem", marginTop: "1rem", lineHeight: "1.5" }}>
                      {highlightMatch(sum.summary, query)}
                    </p>

                    {sum.topics.length > 0 && (
                      <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", alignSelf: "center" }}>Topics:</span>
                        {sum.topics.map((t, idx) => (
                          <span key={idx} style={{ fontSize: "0.75rem", background: "#334155", color: "#e2e8f0", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                            {highlightMatch(t, query)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcripts match */}
          {(activeTab === "all" || activeTab === "transcripts") && results.transcripts.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "#f43f5e", marginBottom: "1rem" }}>Matching Transcript Moments ({results.transcripts.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {results.transcripts.map((tr, idx) => (
                  <div key={idx} style={{
                    background: "#1e293b",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    border: "1px solid #334155",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1.5rem"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.7rem", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                          {tr.classroom_name}
                        </span>
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 500 }}>
                          {tr.lecture_title}
                        </span>
                      </div>
                      <p style={{ color: "#e2e8f0", margin: 0, fontStyle: "italic", fontSize: "0.95rem", lineHeight: "1.4" }}>
                        "{highlightMatch(tr.text, query)}"
                      </p>
                    </div>
                    <Link
                      to={`/lecture/${tr.session_id}?t=${tr.start_time}`}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#334155",
                        color: "#38bdf8",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        textDecoration: "none",
                        whiteSpace: "nowrap"
                      }}
                    >
                      ⏱ {formatTime(tr.start_time)}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query.trim() && !hasResults && (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#1e293b", borderRadius: "16px", border: "1px dashed #475569" }}>
              <span style={{ fontSize: "3rem" }}>🔍</span>
              <h3 style={{ margin: "1rem 0 0.5rem 0", color: "#f8fafc" }}>No matching results found</h3>
              <p style={{ color: "#94a3b8", margin: 0 }}>Try searching for a different keyword or topic phrase.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
