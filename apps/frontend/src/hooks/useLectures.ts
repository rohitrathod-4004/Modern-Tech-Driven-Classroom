import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";

export interface LectureSession {
  _id: string;
  classroom_id: string;
  faculty_id: string;
  title: string;
  session_id: string;
  status: "active" | "completed";
  processing_state: {
    transcription: string;
    summary: string;
    export: string;
  };
  startedAt: string;
  endedAt?: string;
}

export const useLectures = (classroomId: string | null) => {
  const [lectures, setLectures] = useState<LectureSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLectures = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<LectureSession[]>(`/api/lectures/classroom/${classroomId}`);
      setLectures(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  const startLecture = async (classroomId: string, title: string): Promise<LectureSession> => {
    const session = await apiClient.post<LectureSession>("/api/lectures/start", {
      classroom_id: classroomId,
      title,
    });
    setLectures((prev) => [session, ...prev]);
    return session;
  };

  return { lectures, loading, error, fetchLectures, startLecture };
};
