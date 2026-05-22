import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";

export interface SearchedLecture {
  session_id: string;
  title: string;
  classroom_name: string;
  classroom_id: string;
  startedAt: string;
  status: string;
}

export interface SearchedSummary {
  session_id: string;
  lecture_title: string;
  classroom_name: string;
  summary: string;
  topics: string[];
  study_notes: string[];
  generatedAt: string;
}

export interface SearchedTranscript {
  session_id: string;
  lecture_title: string;
  classroom_name: string;
  text: string;
  start_time: number;
  end_time: number;
  chunk_index: number;
}

export interface SearchResults {
  lectures: SearchedLecture[];
  summaries: SearchedSummary[];
  transcripts: SearchedTranscript[];
}

export const useSearch = () => {
  const [results, setResults] = useState<SearchResults>({
    lectures: [],
    summaries: [],
    transcripts: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setResults({ lectures: [], summaries: [], transcripts: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to perform search");
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
};
