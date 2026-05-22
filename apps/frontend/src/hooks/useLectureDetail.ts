import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";

interface TranscriptChunk {
  chunk_index: number;
  text: string;
  status: string;
  start_time: number;
  end_time: number;
}

interface SummaryData {
  summary: string;
  key_points: string[];
  action_items: string[];
  topics?: string[];
  study_notes?: string[];
}

interface LectureDetailData {
  lecture: {
    _id: string;
    title: string;
    session_id: string;
    status: "active" | "completed";
    startedAt: string;
    endedAt?: string;
    classroom_id: string;
    audio_url?: string;
    audio_path?: string;
    processing_state: {
      transcription: string;
      summary: string;
      export: string;
    };
  };
  transcript: TranscriptChunk[];
  summary: SummaryData | null;
}

export const useLectureDetail = () => {
  const [detail, setDetail] = useState<LectureDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<LectureDetailData>(`/api/lectures/${sessionId}`);
      setDetail(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { detail, loading, error, fetchDetail };
};
