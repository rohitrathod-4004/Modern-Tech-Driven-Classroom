import React, { useState } from "react";
import type { FlashcardItem } from "../hooks/useRevision";
import { apiClient } from "../services/apiClient";

interface FlashcardDeckProps {
  cards: FlashcardItem[];
  sessionId: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, sessionId }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  if (cards.length === 0) {
    return (
      <div className="detail-empty-state">
        <span>🎴</span>
        <p>No flashcards are available in this deck.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleUpdateProgress = async (status: "learning" | "mastered", masteryLevel: number) => {
    try {
      await apiClient.put("/api/revision/flashcards/progress", {
        session_id: sessionId,
        card_id: currentCard._id,
        status,
        masteryLevel
      });
      // Advance to next card automatically for seamless flow
      handleNext();
    } catch (err) {
      console.error("Failed to update flashcard progress:", err);
    }
  };

  return (
    <div className="flashcards-container fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* 3D Card Scene Container */}
      <div 
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "280px",
          perspective: "1000px",
          cursor: "pointer",
          marginBottom: "1.5rem"
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Flippable Card Wrapper */}
        <div style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}>
          {/* Front Side */}
          <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)"
          }}>
            <span style={{ fontSize: "0.8rem", color: "#38bdf8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1rem", fontWeight: 600 }}>
              Concept
            </span>
            <h3 style={{ fontSize: "1.25rem", color: "#f8fafc", margin: 0, fontWeight: 600, lineHeight: "1.4" }}>
              {currentCard.front}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2rem" }}>
              🖱️ Click card to reveal explanation
            </span>
          </div>

          {/* Back Side */}
          <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "1.5rem",
            textAlign: "center",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
          }}>
            <span style={{ fontSize: "0.8rem", color: "#10b981", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 600 }}>
              Explanation
            </span>
            <p style={{ fontSize: "0.95rem", color: "#cbd5e1", margin: 0, lineHeight: "1.5" }}>
              {currentCard.back}
            </p>
            
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                className="btn"
                style={{
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateProgress("learning", 30);
                }}
              >
                Learning
              </button>
              <button
                className="btn"
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateProgress("mastered", 100);
                }}
              >
                Mastered
              </button>
            </div>
            
            <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.75rem" }}>
              🖱️ Click card to flip back
            </span>
          </div>
        </div>
      </div>

      {/* Stepper Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <button className="btn btn-reset" onClick={handlePrev} style={{ padding: "0.5rem 1rem", borderRadius: "8px" }}>
          ◀ Prev
        </button>
        <span style={{ color: "#94a3b8", fontSize: "0.9rem", minWidth: "80px", textAlign: "center" }}>
          {currentIndex + 1} / {cards.length}
        </span>
        <button className="btn btn-reset" onClick={handleNext} style={{ padding: "0.5rem 1rem", borderRadius: "8px" }}>
          Next ▶
        </button>
      </div>
    </div>
  );
};
