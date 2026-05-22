import React, { useState } from "react";
import type { QuizQuestion } from "../hooks/useRevision";
import { apiClient } from "../services/apiClient";

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  quizId: string;
  sessionId: string;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ questions, quizId, sessionId }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  if (questions.length === 0) {
    return (
      <div className="detail-empty-state">
        <span>❓</span>
        <p>No questions are available in this quiz.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || hasSubmitted) return;
    setHasSubmitted(true);
    setUserAnswers((prev) => [...prev, selectedOption]);
    if (selectedOption === currentQuestion.answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
    } else {
      // Post quiz attempt
      try {
        await apiClient.post("/api/revision/quiz-attempts", {
          session_id: sessionId,
          quiz_id: quizId,
          answers: userAnswers
        });
      } catch (err) {
        console.error("Failed to post quiz attempt:", err);
      }
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setScore(0);
    setFinished(false);
    setUserAnswers([]);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-result-card fade-in" style={{
        background: "rgba(30, 41, 59, 0.7)",
        borderRadius: "16px",
        padding: "2rem",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          {percentage >= 80 ? "🏆" : percentage >= 50 ? "👍" : "📚"}
        </div>
        <h3 style={{ fontSize: "1.5rem", color: "#fff", marginBottom: "0.5rem" }}>Quiz Completed!</h3>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
          You scored <strong style={{ color: "#38bdf8", fontSize: "1.2rem" }}>{score}</strong> out of {questions.length} ({percentage}%)
        </p>

        <div style={{
          width: "100%",
          height: "8px",
          background: "#1e293b",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "2rem"
        }}>
          <div style={{
            width: `${percentage}%`,
            height: "100%",
            background: percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444",
            transition: "width 0.5s ease"
          }} />
        </div>

        <button className="btn btn-primary" onClick={handleRestart}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container fade-in" style={{
      background: "rgba(30, 41, 59, 0.5)",
      borderRadius: "16px",
      padding: "1.5rem",
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.85rem", color: "#38bdf8", fontWeight: 600 }}>
          QUESTION {currentIndex + 1} OF {questions.length}
        </span>
        <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
          Score: {score}/{currentIndex + (hasSubmitted ? 1 : 0)}
        </span>
      </div>

      {/* Question */}
      <h4 style={{ fontSize: "1.1rem", color: "#f8fafc", lineHeight: "1.5", marginBottom: "1.5rem" }}>
        {currentQuestion.question}
      </h4>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {currentQuestion.options.map((option, idx) => {
          let btnStyle: React.CSSProperties = {
            width: "100%",
            textAlign: "left",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(15, 23, 42, 0.4)",
            color: "#cbd5e1",
            cursor: "pointer",
            fontSize: "0.95rem",
            transition: "all 0.2s ease"
          };

          if (selectedOption === idx) {
            btnStyle.background = "rgba(56, 189, 248, 0.15)";
            btnStyle.border = "1px solid #38bdf8";
            btnStyle.color = "#38bdf8";
          }

          if (hasSubmitted) {
            btnStyle.cursor = "default";
            if (idx === currentQuestion.answerIndex) {
              btnStyle.background = "rgba(16, 185, 129, 0.15)";
              btnStyle.border = "1px solid #10b981";
              btnStyle.color = "#10b981";
            } else if (selectedOption === idx) {
              btnStyle.background = "rgba(239, 68, 68, 0.15)";
              btnStyle.border = "1px solid #ef4444";
              btnStyle.color = "#ef4444";
            }
          }

          return (
            <button
              key={idx}
              style={btnStyle}
              onClick={() => handleSelectOption(idx)}
              disabled={hasSubmitted}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {hasSubmitted && (
        <div className="fade-in" style={{
          background: "rgba(15, 23, 42, 0.3)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          borderLeft: `4px solid ${selectedOption === currentQuestion.answerIndex ? "#10b981" : "#ef4444"}`
        }}>
          <strong style={{ color: "#f8fafc", fontSize: "0.9rem", display: "block", marginBottom: "0.25rem" }}>
            {selectedOption === currentQuestion.answerIndex ? "✓ Correct!" : "✗ Incorrect"}
          </strong>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.5" }}>
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {!hasSubmitted ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={selectedOption === null}
          >
            Submit Answer
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
};
