import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizData {
  _id: string;
  session_id: string;
  questions: QuizQuestion[];
  generatedAt: string;
}

export interface FlashcardItem {
  _id: string;
  front: string;
  back: string;
}

export interface FlashcardData {
  _id: string;
  session_id: string;
  cards: FlashcardItem[];
  generatedAt: string;
}

export const useRevision = () => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRevisionData = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    setQuiz(null);
    setFlashcards(null);
    try {
      // Load both in parallel, handle gracefully if one is missing
      const [quizRes, flashcardRes] = await Promise.allSettled([
        apiClient.get<QuizData>(`/api/lectures/${sessionId}/quiz`),
        apiClient.get<FlashcardData>(`/api/lectures/${sessionId}/flashcards`)
      ]);

      if (quizRes.status === "fulfilled") {
        setQuiz(quizRes.value);
      } else {
        console.warn("[useRevision] Quiz not found or failed to load:", quizRes.reason);
      }

      if (flashcardRes.status === "fulfilled") {
        setFlashcards(flashcardRes.value);
      } else {
        console.warn("[useRevision] Flashcards not found or failed to load:", flashcardRes.reason);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load revision materials");
    } finally {
      setLoading(false);
    }
  }, []);

  return { quiz, flashcards, loading, error, fetchRevisionData };
};
